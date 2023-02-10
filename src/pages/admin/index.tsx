import { UserLayout } from '@layout';
import {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSideProps,
} from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import {
  DynamoDB,
  DynamoDBClientConfig,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';

import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { toast } from 'react-toastify';

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
  beginnerSubmissionData,
  advancedSubmissionData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  const startBeginnerTournament = async () => {
    const response = await axios.post(
      `http://${process.env.MATCHMAKING_SERVER_IP}/tournament/`,
      {
        game_engine_name: process.env.GAME_ENGINE_NAME,
        num_tournament_spots: process.env.NUM_TOURNAMENT_SPOTS,
        user_submissions: beginnerSubmissionData,
      },
    );

    if (response.status === 200) {
      toast.success('Beginner Tournament Started');
    } else {
      toast.error('Beginner Tournament Failed to Start');
    }
  };
  const startAdvancedTournament = async () => {
    const response = await axios.post(
      `http://${process.env.MATCHMAKING_SERVER_IP}/tournament/`,
      {
        game_engine_name: process.env.GAME_ENGINE_NAME,
        num_tournament_spots: process.env.NUM_TOURNAMENT_SPOTS,
        user_submissions: advancedSubmissionData,
      },
    );

    if (response.status === 200) {
      toast.success('Advanced Tournament Started');
    } else {
      toast.error('Advanced Tournament Failed to Start');
    }
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
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Beginner</Card.Title>
              <Card.Text>
                <button type="button" onClick={startBeginnerTournament}>
                  Start a Tournament (Beginner)
                </button>
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Advanced</Card.Title>
              <Card.Text>
                <button type="button" onClick={startAdvancedTournament}>
                  Start a Tournament (Advanced)
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

  const paramsBeginner: ScanCommandInput = {
    TableName: process.env.AWS_PLAYER_TABLE_NAME,
    FilterExpression: 'bracket = :beginner',
    ExpressionAttributeValues: {
      ':beginner': { S: 'beginner' },
    },
  };

  const paramsAdvanced: ScanCommandInput = {
    TableName: process.env.AWS_PLAYER_TABLE_NAME,
    FilterExpression: 'bracket = :advanced',
    ExpressionAttributeValues: {
      ':advanced': { S: 'advanced' },
    },
  };

  const commandBeginner = new ScanCommand(paramsBeginner);
  const resultBeginner = await client.send(commandBeginner);

  const commandAdvanced = new ScanCommand(paramsAdvanced);
  const resultAdvanced = await client.send(commandAdvanced);

  if (
    (!resultAdvanced.Items || !resultAdvanced.Items[0]) &&
    (!resultBeginner.Items || !resultBeginner.Items[0])
  ) {
    return {
      props: {
        beginnerSubmissionData: [],
        advancedSubmissionData: [],
      },
    };
  }

  const itemsBeginner = resultBeginner.Items;
  const beginnerSubmissionData: UserSubmission[] = [];
  if (itemsBeginner) {
    itemsBeginner.forEach((item) => {
      if (item.current_submission_id.S) {
        const userSubmission: UserSubmission = {
          username: item.team_name.S as string,
          s3_bucket_name: process.env.S3_UPLOAD_BUCKET as string,
          s3_object_name: item.current_submission_id.S,
        };
        beginnerSubmissionData.push(userSubmission);
      }
    });
    if (!resultAdvanced.Items || !resultAdvanced.Items[0]) {
      return {
        props: {
          beginnerSubmissionData,
          advancedSubmissionData: [],
        },
      };
    }
  }

  const itemsAdvanced = resultAdvanced.Items;
  const advancedSubmissionData: UserSubmission[] = [];
  if (itemsAdvanced) {
    itemsAdvanced.forEach((item) => {
      if (item.current_submission_id.S) {
        const userSubmission: UserSubmission = {
          username: item.team_name.S as string,
          s3_bucket_name: process.env.S3_UPLOAD_BUCKET as string,
          s3_object_name: item.current_submission_id.S,
        };
        advancedSubmissionData.push(userSubmission);
      }
    });
    if (!resultBeginner.Items || !resultBeginner.Items[0]) {
      return {
        props: {
          beginnerSubmissionData: [],
          advancedSubmissionData,
        },
      };
    }
  }

  return {
    props: { beginnerSubmissionData, advancedSubmissionData }, // will be passed to the page component as props
  };
};
export default Admin;
