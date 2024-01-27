import { UserLayout } from '@layout';
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from 'next';
import { useEffect, useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Router, { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { useCookies } from 'react-cookie';

// Dynamo DB Config
const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
};

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

interface ConfigData {
  disabled_bracket_switching: boolean;
  disabled_team_modifications: boolean;
  disabled_scrimmage_requests: boolean;
  disabled_code_submissions: boolean;
}

const TeamHub: NextPage = ({
  team,
  configData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [createTeamname, setCreateTeamname] = useState<string>('');
  const [joinTeamname, setJoinTeamname] = useState<string>('');
  const [joinSecretKey, setJoinSecretKey] = useState<string>('');

  const { data: session, status } = useSession();

  const [cookies, setCookie] = useCookies(['user']);

  const router = useRouter();

  const createTeam = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (configData.disabled_team_modifications) {
      toast.error('Team modifications are currently disabled.');
      return;
    }
    // only allow alphanumeric characters or - or _
    const regex = /^[a-zA-Z0-9-_]+$/;
    if (!regex.test(createTeamname)) {
      toast.error(
        'Team name must only contain alphanumeric characters, - or _',
      );
      return;
    }

    await axios
      .post('/api/team/create-team', {
        user: session?.user.name,
        teamName: createTeamname,
      })
      .then(() => {
        toast.success('Team created successfully!');
        setCookie(
          'user',
          { ...cookies.user, teamname: createTeamname },
          {
            path: '/',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            secure: true,
            sameSite: 'strict',
          },
        );
        // redirect to team page
        router.push(`team/${createTeamname}`);
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const joinTeam = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (configData.disabled_team_modifications) {
      toast.error('Team modifications are currently disabled.');
      return;
    }

    await axios
      .post('/api/team/join-team', {
        user: session?.user.name,
        teamName: joinTeamname,
        secretKey: joinSecretKey,
      })
      .then(() => {
        toast.success('Team joined successfully!');
        // redirect to team page
        setCookie(
          'user',
          { ...cookies.user, teamname: joinTeamname },
          {
            path: '/',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            secure: true,
            sameSite: 'strict',
          },
        );
        router.push(`team/${joinTeamname}`);
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  useEffect(() => {
    if (team) Router.replace(`/team/${team}`);
  }, [team]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <UserLayout>
      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>Team Hub</Card.Title>
          <Card.Text>
            You can create your own AWAP team and invite others with the secret
            key, or join an existing team with a secret key. You can also leave
            your team at any time.
          </Card.Text>
        </Card.Body>
      </Card>
      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>Join Team</Card.Title>
          <Card.Text>
            If you have a secret key, you can join an existing team.
          </Card.Text>
          <Form onSubmit={joinTeam}>
            <Form.Group controlId='teamName'>
              <Form.Label>
                <strong>Team Name</strong>
              </Form.Label>
              <Form.Control
                className='mb-2'
                type='text'
                placeholder='Enter team name'
                onChange={(e) => setJoinTeamname(e.target.value)}
                minLength={3}
                maxLength={20}
                required
              />
            </Form.Group>
            <Form.Group controlId='secretKey'>
              <Form.Label>
                <strong>Secret Key</strong>
              </Form.Label>
              <Form.Control
                className='mb-2'
                type='text'
                placeholder='Enter secret key'
                onChange={(e) => setJoinSecretKey(e.target.value)}
                minLength={3}
                maxLength={20}
                required
              />
            </Form.Group>
            <Button variant='dark' type='submit'>
              Join Team
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>Create Team</Card.Title>
          <Card.Text>If you do not have a team, you can create one.</Card.Text>
          <Form onSubmit={createTeam}>
            <Form.Group controlId='teamName'>
              <Form.Label>
                <strong>Team Name</strong>
              </Form.Label>
              <Form.Control
                className='mb-2'
                type='text'
                placeholder='Enter team name'
                onChange={(e) => setCreateTeamname(e.target.value)}
                minLength={3}
                maxLength={20}
                required
              />
            </Form.Group>
            <Button variant='dark' type='submit'>
              Create Team
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // query for config data
  const configParams: GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: 'config:config_profile_1',
      sk: 'config:config_profile_1',
    },
  };

  const configCommand = new GetCommand(configParams);
  const configResult = await client.send(configCommand);

  const configData = configResult.Item;

  let configs: ConfigData = {
    disabled_bracket_switching: false,
    disabled_code_submissions: false,
    disabled_scrimmage_requests: false,
    disabled_team_modifications: false,
  };

  if (configData) {
    configs = {
      disabled_bracket_switching: !configData.bracket_switching,
      disabled_code_submissions: !configData.code_submissions,
      disabled_scrimmage_requests: !configData.scrimmage_requests,
      disabled_team_modifications: !configData.team_modifications,
    };
  }

  const getParams: GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: `user:${session.user.name}`,
      sk: `user:${session.user.name}`,
    },
  };

  const command = new GetCommand(getParams);
  const result = await client.send(command);
  if (!result || !result.Item || !result.Item.team || result.Item.team === '') {
    return {
      props: { team: null, configData: configs },
    };
  }

  return {
    props: { team: result.Item.team, configData: configs },
  };
};

export default TeamHub;
