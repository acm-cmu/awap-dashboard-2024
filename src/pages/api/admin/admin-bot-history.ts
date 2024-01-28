import {
  AttributeValue,
  DynamoDB,
  DynamoDBClientConfig,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

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

export interface TeamBot {
  team: string;
  upload_time: string;
  upload_name: string;
  bot: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.name) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  const params: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: process.env.AWS_RECORD_INDEX,
    KeyConditionExpression: 'record_type = :bot',
    ExpressionAttributeValues: {
      ':bot': { S: 'bot' },
    },
  };

  const command = new QueryCommand(params);
  const result: QueryCommandOutput = await client.send(command);

  if (result.Items) {
    const botData = result.Items.map(
      (item: Record<string, AttributeValue>) => ({
        team: item.pk ? item.pk.S?.slice(5) : 'unknown',
        upload_time: item.timeStamp ? item.timeStamp.S : 'unknown',
        upload_name: item.upload_name ? item.upload_name.S : 'unknown',
        bot:
          item.s3_key && item.s3_key.S
            ? process.env.S3_URL_TEMPLATE + item.s3_key.S
            : 'unknown',
      }),
    );

    return res.status(200).json(botData);
  }

  return res.status(200).json([]);
}
