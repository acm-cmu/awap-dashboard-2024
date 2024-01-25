/* eslint-disable max-len */
import type { NextPage } from 'next';
import { UserLayout } from '@layout';
import {
  Form,
  InputGroup,
  Row,
  Col,
  Container,
  Card,
  Button,
} from 'react-bootstrap';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  GetItemInput,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import axios, { AxiosError, AxiosResponse } from 'axios';

import { DynamoDBDocument, GetCommand, GetCommandInput, QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

const Account: NextPage = ({
  userInfo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <div className="bg-light min-vh-100 d-flex flex-row dark:bg-transparent">
          <Container>
            <Row className="justify-content-center">
              <Col md={6}>
                <Card className="mb-4 rounded-0">
                  <Card.Body className="p-4">
                    <h1 className="text-center">{session.user.name}</h1>
                    <div className="text-center">
                      <Image
                        width={300}
                        height={300}
                        src={`/assets/avatars/avatar_${userInfo.image}.jpg`}
                        alt="Team Logo"
                      />
                    </div>
                    <br />
                    <div>
                      Name: <strong>{userInfo.name}</strong>
                    </div>
                    <div>
                      Email: <strong>{userInfo.email}</strong>
                    </div>
                    <div>
                      Team: <strong>{userInfo.team ? userInfo.team : "Not Joined"}</strong>
                    </div>
                    <div>
                      Role: <strong>{userInfo.role}</strong>
                    </div>
                    <br />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </UserLayout>
    );
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

  const params : GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: "user:" + session.user.name,
      sk: "user:" + session.user.name,
    },
  };

  const command = new GetCommand(params);
  const result = await client.send(command);

  const userData = result.Item;

  if (!userData) {
    return {
      props: { 
        userInfo: {
          name: "None",
          email: "None",
          image: 0,
          role: "Competitor",
          team: "None",
        },
      }
    }
  }

  const userInfo = {
    name: userData.name,
    email: userData.email,
    image: userData.image,
    role: userData.role === 'user' ? 'Competitor' : 'Admin',
    team: userData.team,
  };

  return {
    props: { userInfo }, // will be passed to the page component as props
  };
};
export default Account;
