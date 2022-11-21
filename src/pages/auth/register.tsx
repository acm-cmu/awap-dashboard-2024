import { NextPage } from 'next'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import {
  Button, Card, Col, Container, Form, InputGroup, Row,
} from 'react-bootstrap'
import { useRouter } from 'next/router'
import { SyntheticEvent, useState } from 'react'
import { signIn } from 'next-auth/react'

const Register: NextPage = () => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')

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

  const register = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setSubmitting(true)

    if (passwordRepeat !== password) {
      console.log('passwords do not match')
      alert('Passwords do not match')
      setSubmitting(false)
      return
    }

    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
      .then((res) => res.status)
      .then((status) => {
        if (status === 400) {
          console.log('error', 'user already exists')
        } else if (status === 200) {
          login(e)
        }
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center dark:bg-transparent">
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="mb-4 rounded-0">
              <Card.Body className="p-4">
                <h1 className="text-center">Register for AWAP 2023</h1>
                <p className="text-black-50">Create your team account</p>

                <form onSubmit={register}>
                  <InputGroup className="mb-3">
                    <InputGroup.Text><FontAwesomeIcon icon={faUser} fixedWidth /></InputGroup.Text>
                    <Form.Control
                      onChange={(e) => setUsername(e.target.value)}
                      name="username"
                      required
                      disabled={submitting}
                      placeholder="Team Name"
                      aria-label="Team Name"
                    />
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text><FontAwesomeIcon icon={faLock} fixedWidth /></InputGroup.Text>
                    <Form.Control
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      name="password"
                      required
                      disabled={submitting}
                      placeholder="Password"
                      aria-label="Password"
                    />
                  </InputGroup>

                  <InputGroup className="mb-3">
                    <InputGroup.Text><FontAwesomeIcon icon={faLock} fixedWidth /></InputGroup.Text>
                    <Form.Control
                      onChange={(e) => setPasswordRepeat(e.target.value)}
                      type="password"
                      name="password_repeat"
                      required
                      disabled={submitting}
                      placeholder="Repeat password"
                      aria-label="Repeat password"
                    />
                  </InputGroup>

                  <Button type="submit" className="d-block w-100" disabled={submitting} variant="success">
                    Create Account
                  </Button>
                </form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Register
