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

export interface Match {
  id: string;
  player1: string;
  player2: string;
  category: string;
  map: string;
  status: string;
  outcome: string;
  replay: string;
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
    KeyConditionExpression: 'record_type = :matchTeam',
    ExpressionAttributeValues: {
      ':matchTeam': { S: 'matchTeam' },
    },
  };

  const command = new QueryCommand(params);
  const result: QueryCommandOutput = await client.send(command);

  if (result.Items) {
    const matchData = result.Items.map(
      (item: Record<string, AttributeValue>) => ({
        id: item.match_id ? item.match_id.N?.toString() : '-1',
        player1:
          item.players &&
          item.players.L &&
          item.players.L[0] &&
          item.players.L[0].M
            ? item.players.L[0].M.teamName.S
            : 'unknown',
        player2:
          item.players &&
          item.players.L &&
          item.players.L[1] &&
          item.players.L[1].M
            ? item.players.L[1].M.teamName.S
            : 'unknown',
        category: item.category ? item.category.S : 'unknown',
        map: item.map && item.map.S ? item.map.S : 'unknown',
        status: item.item_status ? item.item_status.S : 'unknown',
        outcome: item.placement ? item.placement.N?.toString() : '-1',
        replay:
          item.s3_key && item.s3_key.S
            ? process.env.REPLAY_S3_URL_TEMPLATE + item.s3_key.S
            : 'unknown',
      }),
    );

    return res.status(200).json(matchData);
  }

  return res.status(200).json([]);
}
