/* eslint-disable max-len */
import type { NextPage } from 'next'
import { UserLayout } from '@layout'
import {
  Form, InputGroup, Row, Col, Container, Card, Button,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons'

import { useRouter } from 'next/router'
import { SyntheticEvent, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// id is a number
const TeamMemberField = ({ id } : { id: number }) => {
  const name = `user${id}`
  const placeholder = `Team Member ${id}`
  const ariaLabel = `Team Member ${id}`

  return (
    <InputGroup className="mb-3">
      <InputGroup.Text><FontAwesomeIcon icon={faUser} fixedWidth /></InputGroup.Text>
      <Form.Control
        name={name}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </InputGroup>
  )
}

const Profile: NextPage = () => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const { status } = useSession()

  const update = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setSubmitting(true)

    setTimeout(() => {
      setSubmitting(false)
      // update the user database
      router.reload()
    }, 2000)
  }

  const teamMembers = []
  for (let i = 1; i <= 4; i += 1) {
    teamMembers.push(<TeamMemberField id={i} />)
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login')
  }, [status])

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <div className="bg-light min-vh-100 d-flex flex-row dark:bg-transparent">
          <Container>
            <Row className="justify-content-center">
              <Col md={6}>
                <Card className="mb-4 rounded-0">
                  <Card.Body className="p-4">
                    <h1 className="text-center">Team Profile</h1>
                    <p className="text-black-50">Update your team profile</p>
                    <form onSubmit={update}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text><FontAwesomeIcon icon={faUser} fixedWidth /></InputGroup.Text>
                        <Form.Control
                          name="teamname"
                          required
                          placeholder="Team Name"
                          aria-label="Team Name"
                        />
                      </InputGroup>
                      <InputGroup className="mb-3">
                        <InputGroup.Text><FontAwesomeIcon icon={faLock} fixedWidth /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          name="password"
                          required
                          placeholder="Password"
                          aria-label="Password"
                        />
                      </InputGroup>
                      <InputGroup className="mb-3">
                        <InputGroup.Text><FontAwesomeIcon icon={faLock} fixedWidth /></InputGroup.Text>
                        <Form.Control
                          type="password"
                          name="password_repeat"
                          required
                          placeholder="Repeat password"
                          aria-label="Repeat password"
                        />
                      </InputGroup>
                      {teamMembers}
                      <Button type="submit" className="d-block w-100" variant="success">
                        Update Profile
                      </Button>
                    </form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </UserLayout>
    )
  }
  return <div>loading</div>
}

export default Profile
