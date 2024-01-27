import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import MatchTable from '@components/MatchTable';

const Admin: NextPage = () => {
  const { status, data } = useSession();

  const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

  const { data: MatchData, mutate } = useSWR(
    '/api/admin/admin-match-history',
    fetcher,
  );

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  const startBeginnerTournament = async () => {
    axios
      .post('/api/admin/start-tournament', {
        bracket: 'beginner',
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          toast.success('Beginner Tournament Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
      });
  };

  const startAdvancedTournament = async () => {
    axios
      .post('/api/admin/start-tournament', {
        bracket: 'advanced',
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          toast.success('Advanced Tournament Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
      });
  };

  const startRankedScrimmages = async () => {
    axios
      .post('/api/admin/start-ranked-scrimmages')
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          toast.success('Ranked Scrimmages Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
      });
  };

  const modifyBracketSwitching = async (enabled: boolean) => {
    await axios
      .post('/api/admin/modify-permissions', { bracket_switching: enabled })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          const effect = enabled ? 'Enabled' : 'Disabled';
          toast.success(`Bracket Switching ${effect}!`);
        } else {
          toast.error('Unable to modify permission: Bracket Switching');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else {
          toast.error('Unable to modify permission: Bracket Switching');
        }
      });
  };

  const enableBracketSwitching = async () => {
    modifyBracketSwitching(true);
  };
  const disableBracketSwitching = async () => {
    modifyBracketSwitching(false);
  };

  const modifyTeamModifications = async (enabled: boolean) => {
    await axios
      .post('/api/admin/modify-permissions', { team_modifications: enabled })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          const effect = enabled ? 'Enabled' : 'Disabled';
          toast.success(`Team Modifications ${effect}!`);
        } else {
          toast.error('Unable to modify permission: Team Modifications');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else {
          toast.error('Unable to modify permission: Team Modifications');
        }
      });
  };

  const enableTeamModifications = async () => {
    modifyTeamModifications(true);
  };
  const disableTeamModifications = async () => {
    modifyTeamModifications(false);
  };

  const modifyScrimmageRequests = async (enabled: boolean) => {
    await axios
      .post('/api/admin/modify-permissions', { scrimmage_requests: enabled })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          const effect = enabled ? 'Enabled' : 'Disabled';
          toast.success(`Scrimmage Requests ${effect}!`);
        } else {
          toast.error('Unable to modify permission: Scrimmage Requests');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else {
          toast.error('Unable to modify permission: Scrimmage Requests');
        }
      });
  };

  const enableScrimmageRequests = async () => {
    modifyScrimmageRequests(true);
  };
  const disableScrimmageRequests = async () => {
    modifyScrimmageRequests(false);
  };

  const modifyCodeSubmissions = async (enabled: boolean) => {
    await axios
      .post('/api/admin/modify-permissions', { code_submissions: enabled })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          const effect = enabled ? 'Enabled' : 'Disabled';
          toast.success(`Code Submissions ${effect}!`);
        } else {
          toast.error('Unable to modify permission: Code Submissions');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else {
          toast.error('Unable to modify permission: Code Submissions');
        }
      });
  };

  const enableCodeSubmissions = async () => {
    modifyCodeSubmissions(true);
  };
  const disableCodeSubmissions = async () => {
    modifyCodeSubmissions(false);
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
                Manage Permissions and run ranked scrimmages and tournaments
                here.
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Permissions</Card.Title>
              <div>
                <div className='mb-3'>
                  <Button
                    onClick={enableBracketSwitching}
                    variant='dark'
                    className='mr-3'
                  >
                    Enable Bracket Switching
                  </Button>
                  <Button onClick={disableBracketSwitching} variant='dark'>
                    Disable Bracket Switching
                  </Button>
                </div>

                <div className='mb-3'>
                  <Button
                    onClick={enableTeamModifications}
                    variant='dark'
                    className='mr-3'
                  >
                    Enable Team Modifications
                  </Button>
                  <Button onClick={disableTeamModifications} variant='dark'>
                    Disable Team Modifications
                  </Button>
                </div>

                <div className='mb-3'>
                  <Button
                    onClick={enableScrimmageRequests}
                    variant='dark'
                    className='mr-3'
                  >
                    Enable Scrimmage Requests
                  </Button>
                  <Button
                    onClick={disableScrimmageRequests}
                    variant='dark'
                    className='ml-3'
                  >
                    Disable Scrimmage Requests
                  </Button>
                </div>

                <div className='mb-3'>
                  <Button
                    onClick={enableCodeSubmissions}
                    variant='dark'
                    className='mr-3'
                  >
                    Enable Code Submissions
                  </Button>
                  <Button onClick={disableCodeSubmissions} variant='dark'>
                    Disable Code Submissions
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Beginner</Card.Title>
              <Card.Text>
                <Button onClick={startBeginnerTournament} variant='dark'>
                  Start a Tournament (Beginner)
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Advanced</Card.Title>
              <Card.Text>
                <Button onClick={startAdvancedTournament} variant='dark'>
                  Start a Tournament (Advanced)
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Ranked Scrimmages</Card.Title>
              <Card.Text>
                <Button onClick={startRankedScrimmages} variant='dark'>
                  Start Ranked Scrimmages
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Global Match History</Card.Title>
              <Button
                variant='dark'
                className='mb-3'
                onClick={async () => {
                  mutate();
                }}
              >
                Refresh
              </Button>
              <MatchTable data={MatchData} />
            </Card.Body>
          </Card>
        </UserLayout>
      );
    }
  }
  return <div>loading</div>;
};
export default Admin;
