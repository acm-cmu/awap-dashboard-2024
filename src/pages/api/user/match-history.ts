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
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

interface Match {
  id: string;
  player: string;
  opponent: string;
  outcome: string;
  type: string;
  replay: string | null;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.name) {
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  const teamname = session.user.name;

  // console.log('Match History request from');
  // console.log(teamname);

  const paramsOne: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: process.env.AWS_REVERSE_INDEX,
    KeyConditionExpression: 'sk = :team_name and begins_with(pk, :pk)',
    ExpressionAttributeValues: {
      ':team_name': { S: "team:" + teamname },
      ':pk': { S: "match:" }
    },
  };

  const commandOne = new QueryCommand(paramsOne);
  const resultPlayerOne: QueryCommandOutput = await client.send(commandOne);

  let matchDataPlayerOne: Match[] = [];

  if (resultPlayerOne.Items) {
    matchDataPlayerOne = resultPlayerOne.Items.map((item: any) => ({
      id: item.match_id.N,
      player: teamname,
      opponent: item.players.L[0].M.current.BOOL ? item.players.L[1].M.teamName.S : item.players.L[0].M.teamName.S,
      outcome: item.placement ? item.placement.N.toString(): "PENDING",
      type: item.category.S,
      replay: item.s3_key ? process.env.S3_URL_TEMPLATE + item.s3_key.S : null,
      status: item.item_status.S,
    }));
  }

  for (let i = 0; i < matchDataPlayerOne.length; i += 1) {
    if (matchDataPlayerOne[i].outcome === '1') {
      matchDataPlayerOne[i].outcome = 'WIN';
    } else if (matchDataPlayerOne[i].outcome === '2') {
      matchDataPlayerOne[i].outcome = 'LOSS';
    }
  }

  // sort matchData by id
  const sortedMatchData = matchDataPlayerOne.sort(
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10),
  );
  return res.status(200).json(sortedMatchData);
}
