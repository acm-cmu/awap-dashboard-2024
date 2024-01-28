import { UserLayout } from '@layout';
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from 'next';
import { Button, Card, Col, Container, Row, Modal } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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

interface TeamData {
  members: string[];
  teamname: string;
  rating: number;
  authenticated: boolean;
  bracket: string;
  secret_key: string;
}

interface ConfigData {
  disabled_bracket_switching: boolean;
  disabled_team_modifications: boolean;
  disabled_scrimmage_requests: boolean;
  disabled_code_submissions: boolean;
}

const LeaveTeamModal = ({
  show,
  handleClose,
  handleLeaveTeam,
  numMembers,
}: {
  show: boolean;
  handleClose: any;
  handleLeaveTeam: any;
  numMembers: number;
}) => (
  <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Confirm Leave Team</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Are you sure you want to leave the team?</p>
      {numMembers === 1 && (
        <p>
          You are the only member of this team. If you leave, the team will be
          deleted.
        </p>
      )}
    </Modal.Body>

    <Modal.Footer>
      <Button variant='secondary' onClick={handleClose}>
        Close
      </Button>
      <Button variant='danger' onClick={handleLeaveTeam}>
        Leave Team
      </Button>
    </Modal.Footer>
  </Modal>
);

/* Team Member Display Component */
const TeamMemberField = ({ name }: { name: string }) => (
  <div className='d-flex mb-3'>
    <div className='avatar avatar-sm me-1'>
      <FontAwesomeIcon icon={faUser} fixedWidth />
    </div>
    <div>{name}</div>
  </div>
);

const Team: NextPage = ({
  teamData,
  configData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const teamname: string = router.query.teamname
    ? router.query.teamname.toString()
    : '';

  const { data: session } = useSession();

  const [showModal, setShowModal] = useState(false);

  const [cookies, setCookie, removeCookie] = useCookies(['user']);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    setCookie(
      'user',
      { ...cookies.user, teamname },
      {
        path: '/',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        secure: true,
        sameSite: 'strict',
      },
    );
  }, []);

  const capitalize = (s: string) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const regenerateSecretKey = async () => {
    await axios
      .post('/api/team/regenerate-secret-key', {
        teamname,
      })
      .then((res) => {
        if (res.status === 200) {
          toast.dismiss();
          toast.success('Join key regenerated!', { autoClose: 500 });
          setTimeout(refreshData, 500);
        }
      })
      .catch(() => {
        toast.error('Error regenerating secret key!');
      });
  };

  const handleRegenerateSecretKey = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (configData.disabled_team_modifications) {
      toast.error('Team modifications are currently disabled!');
      return;
    }
    regenerateSecretKey();
  };

  const changeBracket = async (team: string | null | undefined) => {
    if (!team) return;
    toast.error('Bracket changes are currently disabled!');
    // return;
    // const newBracket = document.getElementById(
    //   'newbracket',
    // ) as HTMLInputElement;
    // const newBracketValue = newBracket.value;

    // await axios
    //   .post('/api/team/bracket-change', {
    //     team,
    //     bracket: newBracketValue,
    //   })
    //   .then((res) => {
    //     if (res.status === 200) {
    //       toast.dismiss();
    //       toast.success('Bracket changed successfully!', { autoClose: 2000 });
    //       setTimeout(refreshData, 500);
    //     }
    //   })
    //   .catch(() => {
    //     toast.error('Bracket change not successful!');
    //   });
  };

  const handleChangeBracket = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (configData.disabled_bracket_switching) {
      toast.error('Bracket switching is currently disabled!');
      return;
    }
    changeBracket(teamname);
  };

  const leaveTeam = async () => {
    await axios
      .post('/api/team/leave-team', {
        user: session?.user.name,
        team: teamname,
      })
      .then((res) => {
        if (res.status === 200) {
          toast.dismiss();
          removeCookie('user', { path: '/' });

          toast.success('Left team successfully!', { autoClose: 2000 });
        }
      })
      .catch(() => {
        toast.error('Error leaving team!');
      });

    router.push('/team');
  };

  const handleLeaveTeam = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (configData.disabled_team_modifications) {
      toast.error('Team modifications are currently disabled!');
      return;
    }
    leaveTeam();
  };

  return (
    <UserLayout>
      <LeaveTeamModal
        show={showModal}
        handleClose={handleClose}
        handleLeaveTeam={handleLeaveTeam}
        numMembers={teamData.members.length}
      />
      <div className='bg-light min-vh-100 d-flex flex-row dark:bg-transparent'>
        <Container>
          <Row className='justify-content-center'>
            <Col md={6}>
              <Card className='mb-4 rounded-0'>
                <Card.Body className='p-4'>
                  <h1 className='text-center'>{teamname}</h1>
                  <div>
                    <p>
                      <strong>Members:</strong>
                    </p>
                    {teamData.members.map((member: string) => (
                      <TeamMemberField name={member} key={member} />
                    ))}
                  </div>
                  <div>
                    <p>
                      <strong>Rating:</strong>{' '}
                      {teamData.rating ? teamData.rating : 0}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Bracket:</strong>{' '}
                      {teamData.bracket
                        ? capitalize(teamData.bracket)
                        : 'Beginner'}
                    </p>
                  </div>

                  {teamData.authenticated && (
                    <>
                      <div className='mb-2'>
                        <strong>Change Bracket:</strong>
                      </div>
                      <select
                        className='form-select mb-3'
                        aria-label='Default select example'
                        id='newbracket'
                        defaultValue={
                          teamData.bracket ? teamData.bracket : 'beginner'
                        }
                      >
                        <option value='beginner'>Beginner</option>
                        <option value='advanced'>Advanced</option>
                      </select>
                      <Button
                        onClick={handleChangeBracket}
                        variant='dark'
                        className='mb-3'
                      >
                        Change Bracket
                      </Button>
                      <br />
                      <div>
                        <p>
                          <strong>Secret Key:</strong> {teamData.secret_key}{' '}
                          <span>
                            <FontAwesomeIcon
                              icon={faRefresh}
                              fixedWidth
                              onClick={handleRegenerateSecretKey}
                            />
                          </span>
                        </p>
                      </div>
                      <br />
                      <Button
                        onClick={handleShow}
                        variant='outline-danger'
                        className='mb-3'
                      >
                        Leave Team
                      </Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const username = session.user.name;

  const teamname: string = context.query.teamname
    ? context.query.teamname.toString()
    : '';

  const getParams: GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: `team:${teamname}`,
      sk: `team:${teamname}`,
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

  let authenticated = true;

  if (!teamData.members.has(username)) {
    authenticated = false;
  }

  const members: string[] = Array.from(teamData.members);

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

  const teamDataInfo: TeamData = {
    members,
    teamname: teamData.name,
    rating: teamData.num,
    authenticated,
    bracket: teamData.bracket,
    secret_key: teamData.secret_key,
  };

  return {
    props: {
      teamData: teamDataInfo,
      configData: configs,
    },
  };
};

export default Team;
