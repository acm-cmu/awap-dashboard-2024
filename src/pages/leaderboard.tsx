import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { Card } from 'react-bootstrap'

const Leaderboard: NextPage = () => (
  <UserLayout>
    <Card>
      <Card.Body>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Text>insert table</Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
)

export default Leaderboard
