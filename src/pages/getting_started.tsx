import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { Card } from 'react-bootstrap';

const GettingStarted: NextPage = () => (
  <UserLayout>
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>Getting Started</Card.Title>
        <Card.Text>
          Follow through the instructions below to learn more about installation
          instructions, how you can upload your bot submissions, request
          scrimmages with other players, and check out your match results!
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>Upload Bots</Card.Title>
        <Card.Text>
          Navigate to the submissions page to upload your bot files and view
          your previous submissions. You may upload submissions at any time and
          your current file will be used as your submission for any scrimmages
          you may request or matches we run.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>Scrimmages</Card.Title>
        <Card.Text>
          Find the scrimmages page to request unranked matches with any teams
          listed in the dropdown. You may request up to 5 scrimmages per hour.
          These scrimmages do not affect your rating on the leaderboard.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card>
      <Card.Body>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Text>
          Check out the leaderboard to see how your rating is against other
          teams participating in AWAP.{' '}
        </Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
);

export default GettingStarted;
