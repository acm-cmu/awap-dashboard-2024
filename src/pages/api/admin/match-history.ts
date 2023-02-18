import {
  DynamoDB,
  DynamoDBClientConfig,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
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
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

interface Match {
  id: string;
  player1: string;
  player2: string;
  type: string;
  status: string;
  outcome: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.name) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  // scan for all matches
  const params: ScanCommandInput = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    ProjectionExpression:
      'MATCH_ID, TEAM_1, TEAM_2, MATCH_TYPE, MATCH_STATUS, OUTCOME',
    FilterExpression: 'MATCH_TYPE = :matchType',
    ExpressionAttributeValues: {
      ':matchType': { S: 'tournament' },
    },
  };

  const command = new ScanCommand(params);
  const result: ScanCommandOutput = await client.send(command);

  let matchData: Match[] = [];

  if (result.Items) {
    matchData = result.Items.map((item: any) => ({
      id: item.MATCH_ID.N,
      player1: item.TEAM_1.S,
      player2: item.TEAM_2.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      status: item.MATCH_STATUS.S,
    }));
  }

  // sort matchData by id
  const sortedMatchData = matchData.sort(
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10),
  );

  return res.status(200).json(sortedMatchData);
}
