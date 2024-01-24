import { UserLayout } from '@layout';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { useEffect, useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Router, { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';

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
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });

const TeamHub: NextPage = ({
    team,
  }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const [createTeamname, setCreateTeamname] = useState<string>('');
    const [joinTeamname, setJoinTeamname] = useState<string>('');
    const [joinSecretKey, setJoinSecretKey] = useState<string>('');

    const { data: session, status } = useSession();

    const router = useRouter();

    const createTeam = async () => {
        console.log(createTeamname);

        await axios.post('/api/team/create-team', {
            user: session?.user.name,
            teamName: createTeamname,
        }).then((response) => {
            toast.success("Team created successfully!");
            // redirect to team page
            router.push(`team/${createTeamname}`);

        }
        ).catch((error) => {
            toast.error(error.response.data.message);
        });
    }

    const joinTeam = () => {
        console.log(joinTeamname);
        console.log(joinSecretKey);
    }


    useEffect(() => {
        if (status === 'unauthenticated') Router.replace('/auth/login');
    }, [status]);

    useEffect(() => {
        if (team) Router.replace(`/team/${team}`);
    }, [team]);

    if(status === 'loading') return <div>Loading...</div>;

    return (
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
            <Form>
                <Form.Group controlId="teamName">
                <Form.Label>Team Name</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter team name"
                    onChange={(e) => setCreateTeamname(e.target.value)}
                    minLength={3}
                    maxLength={20}
                    required
                />
                </Form.Group>
                <Button variant="primary" onClick={createTeam}>
                Create Team
                </Button>
            </Form>
        </Card.Body>
        </Card>
    </UserLayout>
    );
}


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
  
    const getParams: GetCommandInput = {
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: "user:" + session.user.name,
        sk: "user:" + session.user.name
      },
    };
  
    const command = new GetCommand(getParams);
    const result = await client.send(command);
    if (!result || !result.Item || !result.Item.team) {
      return {
        props: { team: null },
      };
    }

    console.log(result.Item);

    return {
        props: { team: result.Item.team },
    };
};
  

export default TeamHub;
