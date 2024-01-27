import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
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
    const { team, fileName } = req.body;

    client.send(
      new UpdateCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: `team:${team}`,
          sk: `team:${team}`,
        },
        UpdateExpression: 'SET active_version = :bot',
        ExpressionAttributeValues: {
          ':bot': fileName,
        },
      }),
    );

    res.status(200).json({ fileName });
  } catch (err) {
    res.status(400).json({ message: err });
  }
}
