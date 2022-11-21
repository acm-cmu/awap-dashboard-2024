import { DynamoDB, DynamoDBClientConfig, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import NextAuth, { NextAuthOptions } from 'next-auth'

import CredentialsProvider from 'next-auth/providers/credentials'

import type { NextApiRequest } from 'next'
import { compare } from 'bcrypt'

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.NEXT_AUTH_AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.NEXT_AUTH_AWS_SECRET_KEY as string,
  },
  region: process.env.NEXT_AUTH_AWS_REGION,
}

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
})

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      type: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'awapteam' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req: NextApiRequest) {
        const { username, password } = credentials as { username: string; password: string }

        const user = await client.send(
          new GetItemCommand({
            TableName: process.env.NEXT_AUTH_AWS_TABLE_NAME,
            Key: {
              username: { S: username },
            },
          }),
        )

        // if user is not found, throw error
        if (!user.Item) {
          throw new Error('invalid credentials')
        }

        const hashedpassword: string = user.Item.password.S !== undefined ? user.Item.password.S : ''

        const match = await compare(password, hashedpassword)

        if (!match) {
          throw new Error('invalid credentials')
        }

        return { name: username }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
}

export default NextAuth(authOptions)
