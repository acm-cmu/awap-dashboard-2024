import {
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

export interface Match {
  id: string;
  player1: string;
  player2: string;
  category: string;
  status: string;
  outcome: string;
  replay: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.name) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  const params: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: 'record_type-pk-index',
    KeyConditionExpression: 'record_type = :matchTeam',
    ExpressionAttributeValues: {
      ':matchTeam': { S: 'matchTeam' },
    },
    ProjectionExpression: 'pk, sk, opponent, category, item_status, s3_key',
  };

  const command = new QueryCommand(params);
  const result: QueryCommandOutput = await client.send(command);

  let matchData: Match[] = [];

  if (result.Items) {
    matchData = result.Items.map((item: any) => ({
      id: item.pk ? item.pk.S.slice(6) : '-1',
      player1: item.sk ? item.sk.S.slice(5) : 'unknown',
      player2: item.opponent ? item.opponent.S.slice(5) : 'unknown',
      category: item.category ? item.category.S : 'unknown',
      status: item.item_status ? item.item_status.S : 'unknown',
      outcome: item.outcome ? item.outcome.S : 'unknown',
      replay: item.s3_key ? item.s3_key.S : 'unknown',
    }));
  }

  return res.status(200).json(matchData);
}
