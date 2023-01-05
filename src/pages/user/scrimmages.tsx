import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { use, useEffect, useState } from 'react'
import { Card, Dropdown, Table, Form, Button } from 'react-bootstrap'

import { InferGetServerSidePropsType } from 'next'
import { GetServerSideProps } from 'next'

import { authOptions } from '@pages/api/auth/[...nextauth]'
import { unstable_getServerSession } from 'next-auth/next'

import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'

// Dynamo DB Config
const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
}

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
})

// Table Component
const TableRow: React.FC<{ match: any }> = ({ match }) => {
  return (
    <tr>
      <td>{match.id}</td>
      <td>{match.team}</td>
      <td>{match.result}</td>
      <td>{match.type}</td>
      <td>{match.replay}</td>
    </tr>
  )
}

const TableBody: React.FC<{ data: any }> = ({ data }) => {
  return (
    <tbody>
      {data.map((item: any) => (
        <TableRow match={item} />
      ))}
    </tbody>
  )
}

// Team Info Component Card and button to request match
const TeamInfo: React.FC<{ team: any }> = ({ team }) => {
  // make api request to fastapi

  const request_match2 = () => {
    console.log('request match')
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>{team.teamname}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted"></Card.Subtitle>
        <Card.Text>Rating: {team.rating}</Card.Text>
        <Button variant="primary" onClick={request_match2}>
          Request Match
        </Button>
      </Card.Body>
    </Card>
  )
}

// Scrimmages Page
const Scrimmages: NextPage = ({
  match_data,
  teams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data } = useSession()
  const [TeamValue, setValue] = useState(null)
  const [CurrentTeamSearch, setCurrentTeamSearch] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login')
  }, [status])

  if (status === 'authenticated') {
    const teamnames = teams.map((team) => team.teamname)

    const onSearch = () => {
      // get value from autocomplete
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].teamname === TeamValue) {
          setCurrentTeamSearch(teams[i])
          return
        }
      }
    }

    return (
      <UserLayout>
        <Card className="mb-3">
          <Card.Body>
            <Card.Title>Available Scrimmages</Card.Title>
            <div style={{ display: 'flex' }}>
              <Autocomplete
                disablePortal
                value={TeamValue}
                onChange={(event: any, newTeamValue: string | null) => {
                  setValue(newTeamValue)
                }}
                id="teams_dropdown"
                options={teamnames}
                sx={{ width: 800 }}
                renderInput={(params) => (
                  <TextField {...params} label="Teams" />
                )}
              />
              <Button
                variant="primary"
                style={{ marginLeft: 10 }}
                onClick={onSearch}
                size="lg"
              >
                Search
              </Button>
            </div>
          </Card.Body>
        </Card>
        {/* Create card that displays only if search button is clicked */}
        {CurrentTeamSearch && <TeamInfo team={CurrentTeamSearch} />}
        <Card>
          <Card.Body>
            <Card.Title>Scrimmage History</Card.Title>
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Opponent</th>
                  <th>Winner</th>
                  <th>Type</th>
                  <th>Replay</th>
                </tr>
              </thead>
              <TableBody data={match_data} />
            </Table>
          </Card.Body>
        </Card>
      </UserLayout>
    )
  }

  return <div>loading</div>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  )

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  // if user is logged in, query match data from dynamodb index
  // TODO: Add query for user's team
  const params = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX1,
    KeyConditionExpression: 'TEAM_1 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: session.user.name },
    },
  }

  const command = new QueryCommand(params)
  const result = await client.send(command)

  const match_data1 = result.Items.map((item: any) => ({
    id: item.MATCH_ID.N,
    team: item.TEAM_2.S,
    result: item.OUTCOME.S,
    type: item.TYPE.S,
    replay: item.REPLAY_URL.S,
  }))

  const params2 = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX2,
    KeyConditionExpression: 'TEAM_2 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: session.user.name },
    },
  }

  const command2 = new QueryCommand(params2)
  const result2 = await client.send(command2)

  const match_data2 = result2.Items.map((item: any) => ({
    id: item.MATCH_ID.N,
    team: item.TEAM_1.S,
    result: item.OUTCOME.S,
    type: item.TYPE.S,
    replay: item.REPLAY_URL.S,
  }))

  const match_data = match_data1.concat(match_data2)

  // scan player table for team names
  const params3 = {
    TableName: process.env.AWS_PLAYER_TABLE_NAME,
    ProjectionExpression: 'TEAM_NAME, RATING',
  }

  const command3 = new ScanCommand(params3)
  const result3 = await client.send(command3)

  const teams = result3.Items.map((item: any) => ({
    teamname: item.TEAM_NAME.S,
    rating: item.RATING.N,
  }))

  return {
    props: { match_data, teams }, // will be passed to the page component as props
  }
}

export default Scrimmages
