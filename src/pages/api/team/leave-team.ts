import {
  DynamoDB,
  DynamoDBClientConfig,
  UpdateItemCommand,
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { team, user } = req.body;

    await client.send(
      new UpdateCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: `user:${user}`,
          sk: `user:${user}`,
        },
        UpdateExpression: 'SET team = :team',
        ExpressionAttributeValues: {
          ':team': '',
        },
      }),
    );

    // for some reason string sets are weird so had to use UpdateItemCommand instead of UpdateCommand

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: `team:${team}` },
          sk: { S: `team:${team}` },
        },
        UpdateExpression: 'DELETE members :user',
        ExpressionAttributeValues: {
          ':user': { SS: [user] },
        },
        ReturnValues: 'UPDATED_NEW',
      }),
    );

    res.status(200).json({ message: 'User left team' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
}
