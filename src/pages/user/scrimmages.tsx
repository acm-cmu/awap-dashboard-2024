import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { useEffect } from 'react'
import { Card, Dropdown, Table, Form } from 'react-bootstrap'

import { InferGetServerSidePropsType } from 'next'
import { GetServerSideProps } from 'next'

import { authOptions } from '@pages/api/auth/[...nextauth]'
import { unstable_getServerSession } from 'next-auth/next'

import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

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

const SearchBar = () => {
  return (
    <Form>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Search</Form.Label>
        <Form.Control type="text" placeholder="Search" />
      </Form.Group>
    </Form>
  )
}

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

const Scrimmages: NextPage = ({
  match_data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login')
  }, [status])

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <Card className="mb-3">
          <Card.Body>
            <Card.Title>Available Scrimmages</Card.Title>
            <SearchBar />
          </Card.Body>
          <Card.Body>
            <ul>
              <li>Todo 1: Search bar component for teams (with dropdown)</li>
              <li>Todo 2: Add table of available scrimmages</li>
              <li>Todo 3: Add dropdown to select team </li>
              <li>Todo 4: Add button to start scrimmage</li>
            </ul>
            Include Teams from search bar with request to scrimmage button
          </Card.Body>
        </Card>
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

  console.log(result.Count)

  return {
    props: { match_data }, // will be passed to the page component as props
  }
}

export default Scrimmages
