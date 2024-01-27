import { NextPage } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { SyntheticEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login: NextPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();

  const login = async (e: SyntheticEvent) => {
    e.stopPropagation(); // prevent default form submission
    e.preventDefault(); // prevent default form submission

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      toast.error('Invalid Credentials!');
      console.log('error', res?.error);
    } else if (res?.ok) {
      toast.dismiss();
      router.replace('/');
    }
  };

  return (
    // render login form
    <div className='bg-light min-vh-100 d-flex flex-column justify-content-center align-items-center dark:bg-transparent'>
      <Container>
        <Row className='justify-content-center align-items-center px-3'>
          <Col lg={10}>
            <Row className='justify-content-center align-items-center'>
              <Col md={7} className='bg-white border p-5'>
                <div className=''>
                  <h1>AWAP 2024 Login</h1>
                  <p className='text-black-50'>
                    Sign In to your AWAP Dashboard
                  </p>

                  <form onSubmit={login}>
                    <InputGroup className='mb-3'>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faUser} fixedWidth />
                      </InputGroup.Text>
                      <Form.Control
                        onChange={(e) => setUsername(e.target.value)}
                        type='text'
                        name='username'
                        minLength={3}
                        maxLength={20}
                        required
                        placeholder='Username'
                        aria-label='Username'
                      />
                    </InputGroup>

                    <InputGroup className='mb-3'>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faLock} fixedWidth />
                      </InputGroup.Text>
                      <Form.Control
                        onChange={(e) => setPassword(e.target.value)}
                        type='password'
                        name='password'
                        minLength={8}
                        maxLength={20}
                        required
                        placeholder='Password'
                        aria-label='Password'
                      />
                    </InputGroup>

                    <Row>
                      <Col xs={6}>
                        <Button className='px-4' variant='dark' type='submit'>
                          Login
                        </Button>
                      </Col>
                    </Row>
                  </form>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
