import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { useEffect } from 'react'
import { Card, Dropdown, Table, Form } from 'react-bootstrap'
import { getServerSideProps } from '../pokemons'

import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
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

const TableRow: React.FC<{ data: any }> = ({ data }) => {
  return (
    <tr>
      <td>{data.id}</td>
      <td>{data.team}</td>
      <td>{data.result}</td>
      <td>{data.type}</td>
      <td>{data.replay}</td>
    </tr>
  )
}

const TableBody: React.FC<{ data: any }> = ({ data }) => {
  return (
    <tbody>
      {data.map((item: any) => (
        <TableRow data={item} />
      ))}
    </tbody>
  )
}

const Scrimmages: NextPage = ({ match_data }) => {
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
            // Search bar component for teams (with dropdown) // TODO: Add table
            of available scrimmages // TODO: Add dropdown to select team //
            TODO: Add button to join scrimmage // TODO: Add button to create
            scrimmage //
          </Card.Body>
          <Card.Body>
            // Teams from search bar with request to scrimmage button
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <Card.Title>Scrimmage History</Card.Title>
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Team</th>
                  <th>Result</th>
                  <th>Type</th>
                  <th>Replay</th>
                </tr>
              </thead>
              <TableBody data={match_data} />
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Team 1</td>
                  <td>Win</td>
                  <td>Ranked</td>
                  <td>link from S3 bucket</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Team 1</td>
                  <td>Loss</td>
                  <td>Unranked</td>
                  <td>link from S3 Bucket</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </UserLayout>
    )
  }

  return <div>loading</div>
}

export async function getServerSideProps(context) {
  const params = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    Key: {
      id: '1',
    },
  }
  const matches = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_MATCH_TABLE_NAME,
      Key: {
        id: '1',
      },
    }),
  )

  match_data = matches.map((item: any) => ({
    id: ,
    team: ,
    result: ,
    type: ,
    replay: ,
  }))


  return {
    props: { match_data }, // will be passed to the page component as props
  }
}

export default Scrimmages
