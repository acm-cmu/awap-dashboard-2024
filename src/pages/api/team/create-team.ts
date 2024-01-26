import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { NextApiRequest, NextApiResponse } from 'next';

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

const generateSecretKey = () => {
  const length = 10;
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; i -= 1)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user, teamName } = req.body;

    // check if team name exists
    const team = await client.send(
      new GetItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: `team:${teamName}` },
          sk: { S: `team:${teamName}` },
        },
      }),
    );

    if (team.Item)
      return res.status(400).json({ message: 'Team name already exists' });

    // add team to table
    await client.send(
      new PutItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Item: {
          pk: { S: `team:${teamName}` },
          sk: { S: `team:${teamName}` },
          record_type: { S: 'team' },
          name: { S: teamName },
          members: { SS: [user] },
          bracket: { S: 'beginner' },
          num: { N: '0' },
          active_version: { S: '' },
          secret_key: { S: generateSecretKey() },
        },
      }),
    );

    // add team field to user
    await client.send(
      new UpdateCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: `user:${user}`,
          sk: `user:${user}`,
        },
        UpdateExpression: 'SET team = :team',
        ExpressionAttributeValues: {
          ':team': teamName,
        },
      }),
    );

    return res.status(200).json({ teamName });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
}
