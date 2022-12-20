import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { Card } from 'react-bootstrap'

const GettingStarted: NextPage = () => (
  <UserLayout>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Getting Started</Card.Title>
        <Card.Text>make bots</Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Upload Bots</Card.Title>
        <Card.Text>upload them on submissions</Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Scrimmages</Card.Title>
        <Card.Text>scrimmage other players</Card.Text>
      </Card.Body>
    </Card>
    <Card>
      <Card.Body>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Text>see who is the best</Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
)

export default GettingStarted
