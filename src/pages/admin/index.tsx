import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Button, Card, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import { Match } from '@pages/api/admin/admin-match-history';

const TableRow: React.FC<{ match: Match }> = ({ match }) => {
  let outcomeMsg = '';
  if (match.outcome === 'team1') {
    outcomeMsg = match.player1;
  } else if (match.outcome === 'team2') {
    outcomeMsg = match.player2;
  } else {
    outcomeMsg = 'unknown';
  }

  return (
    <tr>
      <td>{match.id}</td>
      <td>{match.player1}</td>
      <td>{match.player2}</td>
      <td>{match.category}</td>
      <td>{match.status}</td>
      <td>{outcomeMsg}</td>
      <td>
        <a href={match.replay}>Download</a>
      </td>
    </tr>
  );
};

const TableBody: React.FC<{ data: Match[] }> = ({ data }) => {
  if (data == null) {
    console.log('data is null');
  } else if (data.length == 0) {
    console.log('data is zero');
  }
  // eslint-disable-next-line react/jsx-key
  return (
    <tbody>
      {data && data.map((item: Match) => <TableRow match={item} />)}
    </tbody>
  );
};

const MatchTable: React.FC<{ data: Match[] }> = ({ data }) => (
  <Table striped bordered hover className='text-center'>
    <thead>
      <tr>
        <th>Match ID</th>
        <th>Player 1</th>
        <th>Player 2</th>
        <th>Category</th>
        <th>Status</th>
        <th>Outcome</th>
        <th>Replay</th>
      </tr>
    </thead>
    <TableBody data={data} />
  </Table>
);

const Admin: NextPage = () => {
  const { status, data } = useSession();

  const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

  const { data: MatchData, mutate } = useSWR(
    '/api/admin/admin-match-history',
    fetcher
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
          <br />
          <Card>
            <Card.Body>
              <Card.Title>Global Match History</Card.Title>
              <Button
                variant='primary'
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
