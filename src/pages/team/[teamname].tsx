import { UserLayout } from '@layout';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { useRouter } from 'next/router'
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { userInfo } from 'os';
import { useSession } from 'next-auth/react';

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

  /* Team Member Display Component */
const TeamMemberField = ({ name }: { name: string }) => {
    return (
        <div className="d-flex mb-3">
            <div className="avatar avatar-sm me-1">
                <FontAwesomeIcon icon={faUser} fixedWidth />
            </div>
            <div>{name}</div>
        </div>
    );
  };

const Team: NextPage = ({
    teamData,
  }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

    const router = useRouter();
    const { teamname } = router.query;

    const { data: session, status } = useSession();

    return (
        <UserLayout>
            <div className="bg-light min-vh-100 d-flex flex-row dark:bg-transparent">
            <Container>
                <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="mb-4 rounded-0">
                    <Card.Body className="p-4">
                        <h1 className="text-center">{teamname}</h1>
                        <div>
                            <p><strong>Members:</strong></p>
                            {teamData.members.map((member: string) => (
                                <TeamMemberField name={member} />
                            ))}
                        </div>
                        <div>
                            <p><strong>Rating:</strong> {teamData.rating ? teamData.rating : 0}</p>
                        </div>
                    </Card.Body>
                    </Card>
                </Col>
                </Row>
            </Container>
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await unstable_getServerSession(
        context.req,
        context.res,
        authOptions,
    );

    if(!session) {
        return {
            redirect: {
                destination: '/auth/login',
                permanent: false,
            },
        };
    }

    const username = session.user.name;
      
    const { teamname } = context.params;

    console.log(teamname);

    const getParams : GetCommandInput = {
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: "team:" + teamname,
          sk: "team:" + teamname,
        },
      };
    
    const command = new GetCommand(getParams);
    const result = await client.send(command);
    
    const teamData = result.Item;
    
    if (!teamData || !teamData.members) {
        return {
            redirect: {
                destination: '/team',
                permanent: false,
            },
        };
      }

    if(!teamData.members.includes(username)) {
        return {
            props: {
                members: teamData.members,
                teamname: teamData.name,
                rating: teamData.rating,
                authenticated: false,
            }
        };
    }

    return {
        props: { 
            teamData,
            authenticated: true
        },
    }
}

export default Team;
