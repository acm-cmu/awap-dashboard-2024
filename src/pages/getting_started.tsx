import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { Card } from 'react-bootstrap'

const GettingStarted: NextPage = () => (
  <UserLayout>
    <Card>
      <Card.Body>
        <Card.Title>Getting Started</Card.Title>
        <Card.Text>This is the Getting Started page.</Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
)

export default GettingStarted
