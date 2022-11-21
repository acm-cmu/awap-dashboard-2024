import { NextPage } from 'next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import {
  Button,
  Col, Container, Form, InputGroup, Row,
} from 'react-bootstrap'
import Link from 'next/link'
import { SyntheticEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

const Login: NextPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const router = useRouter()

  const login = async (e: SyntheticEvent) => {
    e.stopPropagation() // prevent default form submission
    e.preventDefault() // prevent default form submission

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (res?.error) {
      console.log('error', res?.error)
    } else if (res?.ok) {
      router.replace('/')
    }
  }

  return (// render login form
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center dark:bg-transparent">
      <Container>
        <Row className="justify-content-center align-items-center px-3">
          <Col lg={8}>
            <Row>
              <Col md={7} className="bg-white border p-5">
                <div className="">
                  <h1>Login</h1>
                  <p className="text-black-50">Sign In to your AWAP Dashboard</p>

                  <form onSubmit={login}>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FontAwesomeIcon
                          icon={faUser}
                          fixedWidth
                        />
                      </InputGroup.Text>
                      <Form.Control
                        onChange={(e) => setUsername(e.target.value)}
                        type="text"
                        name="username"
                        required
                        placeholder="Username"
                        aria-label="Username"
                      />
                    </InputGroup>

                    <InputGroup className="mb-3">
                      <InputGroup.Text>
                        <FontAwesomeIcon
                          icon={faLock}
                          fixedWidth
                        />
                      </InputGroup.Text>
                      <Form.Control
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        name="password"
                        required
                        placeholder="Password"
                        aria-label="Password"
                      />
                    </InputGroup>

                    <Row>
                      <Col xs={6}>
                        <Button className="px-4" variant="primary" type="submit">Login</Button>
                      </Col>
                      <Col xs={6} className="text-end">
                        <Button className="px-0" variant="link" type="submit">
                          Forgot
                          password?
                        </Button>
                      </Col>
                    </Row>
                  </form>
                </div>
              </Col>
              <Col
                md={5}
                className="bg-primary text-white d-flex align-items-center justify-content-center p-5"
              >
                <div className="text-center">
                  <h2>Sign up</h2>
                  <p>
                    Don't have an account, but want to compete in AWAP 2023?
                  </p>
                  <Link href="/auth/register">
                    <button className="btn btn-lg btn-outline-light mt-3" type="button">
                      Register Now!
                    </button>
                  </Link>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login
