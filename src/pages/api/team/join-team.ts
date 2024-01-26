import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user, teamName, secretKey } = req.body;

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

    if (!team.Item || !team.Item.members || !team.Item.members.SS)
      return res.status(400).json({ message: 'Team does not exist!' });

    const teamMembers = team.Item.members.SS;

    if (teamMembers.length >= 4)
      return res.status(400).json({ message: 'Team is full!' });

    const teamSecretKey = team.Item.secret_key.S;

    if (teamSecretKey !== secretKey)
      return res.status(400).json({ message: 'Incorrect secret key!' });

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

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: `team:${teamName}` },
          sk: { S: `team:${teamName}` },
        },
        UpdateExpression: 'ADD members :user',
        ExpressionAttributeValues: {
          ':user': { SS: [user] },
        },
      }),
    );

    return res.status(200).json({ message: 'Successfully joined team!' });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
}
