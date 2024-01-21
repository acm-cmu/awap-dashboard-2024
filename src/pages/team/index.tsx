import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { Card } from 'react-bootstrap';

const TeamHub: NextPage = () => (
  <UserLayout>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Team Hub</Card.Title>
        <Card.Text>
          You can create your own AWAP team and invite others with the secret key, or join an existing team with a secret key. You can also leave your team at any time.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Join Team</Card.Title>
        <Card.Text>
            If you have a secret key, you can join an existing team.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Create Team</Card.Title>
        <Card.Text>
            If you don't have a team, you can create one.
        </Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
);

export default TeamHub;
