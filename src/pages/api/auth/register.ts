import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

import type { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcrypt'

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
}

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { username, password } = req.body

  const hashedpassword = await hash(password, 10)

  const user = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_USER_TABLE_NAME,
      Key: {
        username: { S: username },
      },
    }),
  )

  if (user.Item) {
    res.status(400).json({ message: 'user already exists' })
  } else {
    await client.send(
      new PutItemCommand({
        TableName: process.env.AWS_USER_TABLE_NAME,
        Item: {
          username: { S: username },
          password: { S: hashedpassword },
          role: { S: 'user' },
        },
      }),
    )
    res.status(200).json({ message: 'success' })
  }
}