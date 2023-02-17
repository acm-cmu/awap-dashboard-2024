import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { Card } from 'react-bootstrap';

const GettingStarted: NextPage = () => (
  <UserLayout>
    <Card.Title>Getting Started</Card.Title>
    <Card.Text>
      Our full game rules can be found{' '}
      <a href="https://docs.google.com/document/d/1piTDL6cHUQIYDfd75VNeHqWmxzcqkFHyf-bdmmrDsmc/edit?usp=sharing">
        here
      </a>
      ! Keep reading to install the Martian environment, upload your algorithm
      submissions, request scrimmages with other players, and check out your
      match results. Happy hacking!
    </Card.Text>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Installation</Card.Title>
        <Card.Text>
          You will need exactly Python 3.9, and will use the{' '}
          <a href="https://dashboard.awap.acmatcmu.com/">Dashboard</a>,{' '}
          <a href="https://view.awap.acmatcmu.com">Viewer</a>, and{' '}
          <a href="https://awap.acmatcmu.com/engine">Engine</a> to
          compete and iterate on your algorithms. Reference the{' '}
          <a href="https://docs.google.com/document/d/1piTDL6cHUQIYDfd75VNeHqWmxzcqkFHyf-bdmmrDsmc/edit?usp=sharing">
            {' '}
            Mars Makeover Rules{' '}
          </a>
          for documentation!
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Upload Bots</Card.Title>
        <Card.Text>
          Navigate to the Submissions page to upload your bot files and view
          your previous submissions. You may upload submissions at any time and
          your current file will be used as your submission for any scrimmages
          or tournament matches.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Scrimmages</Card.Title>
        <Card.Text>
          Navigate to the Scrimmages page to request unranked matches with any
          teams listed in the dropdown. You may request up to 5 scrimmages per
          hour. These scrimmages do not affect your rating on the leaderboard.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card>
      <Card.Body>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Text>
          Navigate to the Leaderboard page to see your rating against other teams
          participating in AWAP 2023!
        </Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
);

export default GettingStarted;
