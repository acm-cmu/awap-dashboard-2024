import { UserLayout } from '@layout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import { useEffect } from 'react'

const Submissions: NextPage = () => {
  const { status, data } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login')
  }, [status])

  if (status === 'authenticated') {
    return (
      <UserLayout>
        <div>
          This page is Protected for special people. like
          {'\n'}
          {JSON.stringify(data.user, null, 2)}
        </div>
      </UserLayout>
    )
  }

  return <div>loading</div>
}

export default Submissions
