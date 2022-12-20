import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { useEffect } from 'react'
import { Card } from 'react-bootstrap'

const Submissions: NextPage = () => {
  const { status, data } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login')
  }, [status])

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <Card>
          <Card.Body>
            <Card.Title>Scrimmages</Card.Title>
            <Card.Text>This page is Protected.</Card.Text>
          </Card.Body>
        </Card>
      </UserLayout>
    )
  }

  return <div>loading</div>
}

export default Submissions
