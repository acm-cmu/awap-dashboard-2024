import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
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
    res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { teamname } = req.body;

    // check if team name exists
    const team = await client.send(
      new GetItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: `team:${teamname}` },
          sk: { S: `team:${teamname}` },
        },
      }),
    );

    if (!team.Item) {
      return res.status(400).json({ message: 'Team does not exist!' });
    }

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: `team:${teamname}` },
          sk: { S: `team:${teamname}` },
        },
        UpdateExpression: 'SET secret_key = :secret_key',
        ExpressionAttributeValues: {
          ':secret_key': { S: generateSecretKey() },
        },
      }),
    );

    return res.status(200).json({ message: 'Regenerated Join Key' });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
}
