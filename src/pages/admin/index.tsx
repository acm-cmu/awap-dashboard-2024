import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Button, Card, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import { useEffect } from 'react';
import Router from 'next/router';

interface Match {
  id: string;
  player1: string;
  player2: string;
  type: string;
  status: string;
  outcome: string;
}

const TableRow: React.FC<{ match: Match }> = ({ match }) => {
  let backgroundColor;
  if (match.type === 'unranked') {
    backgroundColor = 'rgb(209, 236, 201)'; // light red
  } else if (match.type === 'ranked') {
    backgroundColor = 'rgb(245, 205, 213)'; // light green
  } else if (match.type === 'tournament') {
    backgroundColor = 'rgb(255, 255, 0)'; // yellow
  }

  return (
    <tr style={{ backgroundColor }}>
      <td>{match.id}</td>
      <td>{match.player1}</td>
      <td>{match.player2}</td>
      <td>{match.type}</td>
      <td>{match.status}</td>
      <td>{match.outcome}</td>
    </tr>
  );
};

const TableBody: React.FC<{ data: Match[] }> = ({ data }) => (
  // eslint-disable-next-line react/jsx-key
  <tbody>{data && data.map((item: Match) => <TableRow match={item} />)}</tbody>
);

const MatchTable: React.FC<{ data: Match[] }> = ({ data }) => (
  <Table striped bordered hover className="text-center">
    <thead>
      <tr>
        <th>Match ID</th>
        <th>Player 1</th>
        <th>Player 2</th>
        <th>Type</th>
        <th>Status</th>
        <th>Outcome</th>
      </tr>
    </thead>
    <TableBody data={data} />
  </Table>
);
const Admin: NextPage = () => {
  const { status, data } = useSession();

  const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

  const { data: MatchData, mutate } = useSWR(
    '/api/admin/match-history',
    fetcher,
  );

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  const startBeginnerTournament = async () => {
    console.log('request sent');
    axios
      .post('/api/admin/start-tournament', {
        bracket: 'beginner',
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          console.log('request sent');
          toast.success('Beginner Tournament Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
        console.log(reason.message);
      });
  };

  const startAdvancedTournament = async () => {
    console.log('request sent');
    axios
      .post('/api/admin/start-tournament', {
        bracket: 'advanced',
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          console.log('request sent');
          toast.success('Advanced Tournament Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
        console.log(reason.message);
      });
  };

  const startTestTournament = async () => {
    console.log('request sent');
    axios
      .post('/api/admin/start-tournament', {
        bracket: 'test',
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          console.log('request sent');
          toast.success('Test Tournament Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
        console.log(reason.message);
      });
  };

  const startRankedScrimmages = async () => {
    console.log('request sent');
    axios
      .post('/api/admin/start-ranked-scrimmages')
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          console.log('request sent');
          toast.success('Ranked Scrimmages Started!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
        console.log(reason.message);
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
              <Card.Text>Run ranked scrimmages and tournaments here.</Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Test Tournament</Card.Title>
              <Card.Text>
                <Button onClick={startTestTournament}>
                  Start a Test Tournament (Rafflebots)
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Beginner</Card.Title>
              <Card.Text>
                <Button onClick={startBeginnerTournament}>
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
                <Button onClick={startAdvancedTournament}>
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
                <Button onClick={startRankedScrimmages}>
                  Start Ranked Scrimmages
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Card.Title>Global Match History</Card.Title>
              <Button
                variant="primary"
                className="mb-3"
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
