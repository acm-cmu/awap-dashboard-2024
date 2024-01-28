import {
  DynamoDB,
  DynamoDBClientConfig,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand } from '@aws-sdk/lib-dynamodb';
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
  map: string;
  outcome: string;
  type: string;
  replay: string | null;
  status: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.name) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  const user = session.user.name;

  try {
    const userInfo = await client.send(
      new GetCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: `user:${user}`,
          sk: `user:${user}`,
        },
        ProjectionExpression: 'team',
      }),
    );

    if (!userInfo.Item) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const teamname = userInfo.Item.team;

    const queryMatchParams: QueryCommandInput = {
      TableName: process.env.AWS_TABLE_NAME,
      IndexName: process.env.AWS_REVERSE_INDEX,
      KeyConditionExpression: 'sk = :team_name and begins_with(pk, :pk)',
      ExpressionAttributeValues: {
        ':team_name': { S: `team:${teamname}` },
        ':pk': { S: 'match:' },
      },
    };

    const command = new QueryCommand(queryMatchParams);
    const matchHistoryResult: QueryCommandOutput = await client.send(command);

    let teamMatchData: Match[] = [];

    if (matchHistoryResult.Items) {
      teamMatchData = matchHistoryResult.Items.map((item: any) => ({
        id: item.match_id.N,
        player1: item.players.L[0].M.teamName.S,
        player2: item.players.L[1].M.teamName.S,
        map: item.map ? item.map.S : 'Unknown',
        outcome: item.placement ? item.placement.N.toString() : 'PENDING',
        type: item.category.S,
        replay: item.s3_key
          ? process.env.REPLAY_S3_URL_TEMPLATE + item.s3_key.S
          : null,
        status: item.item_status.S,
        timestamp: item.timestamp ? item.timestamp.S : 'unknown',
      }));
    }

    for (let i = 0; i < teamMatchData.length; i += 1) {
      if (teamMatchData[i].outcome === '1') {
        teamMatchData[i].outcome = 'WIN';
      } else if (teamMatchData[i].outcome === '2') {
        teamMatchData[i].outcome = 'LOSS';
      }
    }

    // sort matchData by id
    const sortedMatchData = teamMatchData.sort(
      (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10),
    );
    return res.status(200).json(sortedMatchData);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
