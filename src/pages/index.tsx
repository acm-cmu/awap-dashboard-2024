import type { NextPage } from 'next';
import { UserLayout } from '@layout';
import React from 'react';
import { Card } from 'react-bootstrap';

const Home: NextPage = () => (
  <UserLayout>
    <Card>
      <Card.Body>
        <Card.Title>Home</Card.Title>
        <Card.Text>
          Welcome to AWAP 2024! :D Thanks for registering and creating an
          account. Navigate to the getting started page to begin!
        </Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
);

export default Home;
