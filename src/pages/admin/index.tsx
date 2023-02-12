import { UserLayout } from '@layout';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';

const Admin: NextPage = () => {
  const { status, data } = useSession();

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
        </UserLayout>
      );
    }
  }
  return <div>loading</div>;
};
export default Admin;
