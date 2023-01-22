import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import {
  DynamoDB,
  DynamoDBClientConfig,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

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

interface UserSubmission {
  username: string;
  s3_bucket_name: string;
  s3_object_name: string;
}

const Admin: NextPage = ({
  userSubmissionData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  const startTournament = async () => {
    const { data } = await axios.post('http://localhost:8000/match', {
      game_engine_name: process.env.GAME_ENGINE_NAME,
      num_tournament_spots: process.env.NUM_TOURNAMENT_SPOTS,
      user_submissions: userSubmissionData,
    });
  };
  if (status === 'authenticated') {
    if (data?.user?.role === 'user') {
      Router.replace('/unauthorized');
    } else {
      return (
        <UserLayout>
          <Card>
            <Card.Body>
              <Card.Title>Admin</Card.Title>
              <Card.Text>
                This page is protected for special people like
                {JSON.stringify(data?.user, null, 2)}
              </Card.Text>
            </Card.Body>
          </Card>
          <br></br>
          <Card>
            <Card.Body>
              <Card.Title>Start a Tournament</Card.Title>
              <Card.Text>
                <button type="button" onClick={startTournament}>
                  Start a Tournament
                </button>
              </Card.Text>
            </Card.Body>
          </Card>
        </UserLayout>
      );
    }
  }
  return <div>loading</div>;
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

  const params: QueryCommandInput = {
    TableName: process.env.AWS_PLAYER_TABLE_NAME,
  };

  const command = new ScanCommand(params);
  const result = await client.send(command);
  if (!result.Items || !result.Items[0]) {
    return {
      props: {
        userSubmissionData: [],
      },
    };
  }

  const userData = result.Items;
  const userSubmissionData: UserSubmission[] = [];
  const numSubmissions = userData.length;

  for (let i = 0; i < numSubmissions; i++) {
    if (userData[i].current_submission_id) {
      const userSubmission: UserSubmission = {
        username: userData[i].team_name.S,
        s3_bucket_name: process.env.S3_UPLOAD_BUCKET,
        s3_object_name: userData[i].current_submission_id.S,
      };
      userSubmissionData.push(userSubmission);
    }
  }

  return {
    props: { userSubmissionData }, // will be passed to the page component as props
  };
};
export default Admin;
