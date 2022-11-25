import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { useEffect } from 'react'
import { Card } from 'react-bootstrap'

const Scrimmages: NextPage = () => {
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
            <Card.Text>
              This page is Protected for special people. like
              {JSON.stringify(data?.user, null, 2)}
            </Card.Text>
          </Card.Body>
        </Card>
      </UserLayout>
    )
  }

  return <div>loading</div>
}

export default Scrimmages
