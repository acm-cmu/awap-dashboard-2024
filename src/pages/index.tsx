import type { NextPage } from 'next'
import { UserLayout } from '@layout'
import React from 'react'
import { Card } from 'react-bootstrap'

const Home: NextPage = () => (
  <UserLayout>
    <Card>
      <Card.Body>
        <Card.Title>Home</Card.Title>
        <Card.Text>add text...</Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
)

export default Home
