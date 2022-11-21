import {
  DynamoDB, DynamoDBClientConfig, GetItemCommand, PutItemCommand,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

import type { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcrypt'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body

  const hashedpassword = await hash(password, 10)

  const user = await client.send(
    new GetItemCommand({
      TableName: process.env.NEXT_AUTH_AWS_TABLE_NAME,
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
        TableName: process.env.NEXT_AUTH_AWS_TABLE_NAME,
        Item: {
          username: { S: username },
          password: { S: hashedpassword },
        },
      }),
    )
    res.status(200).json({ message: 'success' })
  }
}
