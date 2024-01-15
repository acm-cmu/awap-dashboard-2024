/* eslint-disable no-param-reassign */
import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import NextAuth, { NextAuthOptions } from 'next-auth';

import CredentialsProvider from 'next-auth/providers/credentials';

import { compare } from 'bcrypt';

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
};

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        const user = await client.send(
          new GetItemCommand({
            TableName: process.env.AWS_TABLE_NAME,
            Key: {
              pk: { S: "user:"+username },
              sk: { S: "user:"+username },
            },
          }),
        );
        console.log(user)
        console.log(user.Item)
        console.log(user.Item.password.S)
        console.log(password)

        // if user is not found, throw error
        if (!user.Item) {
          throw new Error('invalid credentials');
        }

        const hashedpassword: string =
          user.Item.password.S !== undefined ? user.Item.password.S : '';

        const match = await compare(password, hashedpassword);

        if (!match) {
          throw new Error('invalid credentials');
        }

        return {
          id: username,
          name: username,
          role: user.Item.role.S,
          email: user.Item.email !== undefined ? user.Item.email.S : '',
          image: user.Item.image !== undefined ? user.Item.image.N : '0',
        };
      },
    }),
  ],
  callbacks: {
    jwt(params) {
      // update token
      if (params.user?.role) {
        params.token.role = params.user.role;
      }
      // return final_token
      return params.token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
  },
};

export default NextAuth(authOptions);
