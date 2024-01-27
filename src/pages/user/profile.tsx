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
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DynamoDBDocument, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// id is a number
const TeamMemberField = ({ id }: { id: number }) => {
  const name = `user${id}`;
  const placeholder = `Team Member ${id}`;
  const ariaLabel = `Team Member ${id}`;

  return (
    <InputGroup className='mb-3'>
      <InputGroup.Text>
        <FontAwesomeIcon icon={faUser} fixedWidth />
      </InputGroup.Text>
      <Form.Control
        name={name}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </InputGroup>
  );
};
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

const Profile: NextPage = ({
  team,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const changeBracket = async (user: string | null | undefined) => {
    if (!user) return;
    const teamName = document.getElementById('teamname') as HTMLInputElement;
    const newBracket = document.getElementById(
      'newbracket',
    ) as HTMLInputElement;
    const newBracketValue = newBracket.value;
    await axios
      .post('/api/user/bracket-change', {
        user,
        bracket: newBracketValue,
        teamName: teamName.value,
      })
      // .then((res) => res.status)
      .then((res) => {
        if (res.status === 400) {
          toast.error('Bracket change not successful!');
        } else if (res.status === 200) {
          toast.dismiss();
          toast.success('Bracket changed successfully!', { autoClose: 2000 });
        }
      });
    window.location.reload();
    window.location.reload();
  };
  const createTeam = async (user: string | null | undefined) => {
    if (!user) return;
    const teamName = document.getElementById('teamname') as HTMLInputElement;

    const teamNameValue = teamName.value;
    await axios
      .post('/api/user/create-team', {
        user,
        teamName: teamNameValue,
      })
      .then((res) => res.status)
      .then((status1) => {
        if (status1 === 400) {
          toast.error('Team name already in use!');
        } else if (status1 === 200) {
          toast.dismiss();
          toast.success('Team created successfully!', { autoClose: 2000 });
        }
      });
    // await axios.post('/api/user/create-team', {
    //   user,
    //   bracket: teamNameValue,
    // });
    window.location.reload();
  };

  const handleChangeBracket = async () => changeBracket(session?.user.name);

  const handleCreateTeam = async () => createTeam(session?.user.name);

  const teamMembers = [];
  for (let i = 1; i <= 4; i += 1) {
    teamMembers.push(<TeamMemberField id={i} />);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <div className='bg-light min-vh-100 d-flex flex-row dark:bg-transparent'>
          <Container>
            <Row className='justify-content-center'>
              <Col md={6}>
                <Card className='mb-4 rounded-0'>
                  <Card.Body className='p-4'>
                    <h1 className='text-center'>Team Actions</h1>

                    {/* <br /> */}
                    <div>
                      <strong>Create Team</strong>
                    </div>

                    <form onSubmit={handleCreateTeam}>
                      <label>
                        Team Name:
                        <input type='text' name='name' id='teamname' />
                      </label>
                      <input type='submit' value='Submit' />
                    </form>
                    {/* <br />
                    <div>
                      <strong>Add Team Members</strong>
                    </div>

                    <form onSubmit={handleAddTeamMember}>
                    <label>
                      User Name: 
                      <input type="text" name="name" id="teamname" />
                    </label>
                    <input type="submit" value="Submit" />
                  </form> */}
                    <br />
                  </Card.Body>
                </Card>
              </Col>
              {/* </Row>
            <Row className="justify-content-center"> */}
              <Col md={6}>
                <Card className='mb-4 rounded-0'>
                  <Card.Body className='p-4'>
                    <h1 className='text-center'>Team Profile</h1>
                    <div className='text-center'>
                      <Image
                        width={300}
                        height={300}
                        src={`/assets/avatars/avatar_${session.user.image}.png`}
                        alt='Team Logo'
                      />
                    </div>
                    <div>
                      User Name: <strong>{session.user.name}</strong>
                    </div>
                    <div>
                      Team Lead Email: <strong>{session.user.email}</strong>
                    </div>
                    <div>
                      Team Name:
                      <strong>{team.name}</strong>
                    </div>
                    <div>
                      Bracket:{' '}
                      <strong>
                        {team.bracket.charAt(0).toUpperCase() +
                          team.bracket.slice(1)}
                      </strong>
                    </div>
                    <br />
                    <div>
                      <strong>Change Bracket:</strong>
                    </div>

                    <select
                      className='form-select'
                      aria-label='Default select example'
                      id='newbracket'
                    >
                      <option value='beginner'>Beginner</option>
                      <option value='advanced'>Advanced</option>
                    </select>
                    <br />
                    <Button onClick={handleChangeBracket} variant='dark'>
                      Change Bracket
                    </Button>
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
  let bracketN = 'Beginner';
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
  const userquery = `user:${session.user.name}`;
  const params: ScanCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    FilterExpression: 'pk = :user_name',
    ExpressionAttributeValues: {
      ':user_name': { S: userquery },
    },
  };

  const command = new ScanCommand(params);
  const result = await client.send(command);

  const userData = result.Items;
  if (!userData) {
    return {
      props: { team: { bracket: null } }, // will be passed to the page component as props
    };
  }
  const teamquery = `team:${userData[0].team.S}`;
  const result2 = await client.send(
    new ScanCommand({
      TableName: process.env.AWS_TABLE_NAME,
      FilterExpression: 'pk = :team_name AND record_type= :bracket',
      ExpressionAttributeValues: {
        ':team_name': { S: teamquery },
        ':bracket': { S: 'bracket' },
      },
    }),
  );
  const teamData = result2.Items;

  if (
    teamData &&
    teamData[0] &&
    teamData[0].bracket &&
    typeof teamData[0].bracket.S === 'string'
  ) {
    bracketN = teamData[0].bracket.S;
  }
  const team = {
    name: userData[0].team.S,
    bracket: bracketN,
  };

  return {
    props: { team }, // will be passed to the page component as props
  };
};
export default Profile;
