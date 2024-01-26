import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

import type { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcrypt';

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL as string,
    secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL as string,
  },
  region: process.env.AWS_REGION_LOCAL,
};

const client = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

function getRandomIntInclusive(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { username, password, name, email } = req.body;

  const hashedpassword = await hash(password, 10);

  try {
    const user = await client.send(
      new GetCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: `user:${username}`,
          sk: `user:${username}`,
        },
      }),
    );

    if (user.Item)
      return res.status(400).json({ message: 'user already exists' });

    await client.send(
      new PutCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Item: {
          pk: `user:${username}`,
          sk: `user:${username}`,
          record_type: 'user',
          name,
          email,
          password: hashedpassword,
          role: 'user',
          image: getRandomIntInclusive(1, 27),
          team: '',
        },
      }),
    );

    return res.status(200).json({ message: 'success' });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
}
