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
          scrimmages with other players, and check out your match results!{' '}
          <br />
          <br />
          Landing Page:{' '}
          <a
            href='http://awap.acmatcmu.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            awap.acmatcmu.com
          </a>
          <br />
          Dashboard:{' '}
          <a
            href='http://dashboard.awap.acmatcmu.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            dashboard.awap.acmatcmu.com
          </a>
          <br />
          Player Guide:{' '}
          <a
            href='http://tinyurl.com/debrisdefense'
            target='_blank'
            rel='noopener noreferrer'
          >
            tinyurl.com/debrisdefense
          </a>
          <br />
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>Upload Bots</Card.Title>
        <Card.Text>
          Navigate to the submissions page to upload your bot files and view
          your previous submissions. You may upload submissions at any time and
          your currently activated file will be used as your submission for any
          scrimmages you may request or matches we run.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>Scrimmages</Card.Title>
        <Card.Text>
          Find the scrimmages page to request unranked matches with any teams
          listed in the dropdown. Your team may request up to 5 scrimmages per
          hour. These scrimmages do not affect your rating on the leaderboard.
          Only the matches that we will run periodically throughout the
          competition affect your rating.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className='mb-3'>
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
