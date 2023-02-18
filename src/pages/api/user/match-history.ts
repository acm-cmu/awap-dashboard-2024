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
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX1,
    KeyConditionExpression: 'TEAM_1 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: teamname },
    },
  };

  const commandOne = new QueryCommand(paramsOne);
  const resultPlayerOne: QueryCommandOutput = await client.send(commandOne);

  let matchDataPlayerOne: Match[] = [];

  if (resultPlayerOne.Items) {
    matchDataPlayerOne = resultPlayerOne.Items.map((item: any) => ({
      id: item.MATCH_ID.N,
      player: item.TEAM_1.S,
      opponent: item.TEAM_2.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      replay: item.REPLAY_URL ? item.REPLAY_URL.S : null,
      status: item.MATCH_STATUS.S,
    }));
  }

  for (let i = 0; i < matchDataPlayerOne.length; i += 1) {
    if (matchDataPlayerOne[i].outcome === 'team1') {
      matchDataPlayerOne[i].outcome = 'WIN';
    } else if (matchDataPlayerOne[i].outcome === 'team2') {
      matchDataPlayerOne[i].outcome = 'LOSS';
    }
  }

  const paramsTwo: QueryCommandInput = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX2,
    KeyConditionExpression: 'TEAM_2 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: teamname },
    },
  };

  const commandTwo = new QueryCommand(paramsTwo);
  const resultPlayerTwo: QueryCommandOutput = await client.send(commandTwo);

  let matchDataPlayerTwo: Match[] = [];

  if (resultPlayerTwo.Items) {
    matchDataPlayerTwo = resultPlayerTwo.Items.map((item: any) => ({
      id: item.MATCH_ID.N,
      player: item.TEAM_2.S,
      opponent: item.TEAM_1.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      replay: item.REPLAY_URL ? item.REPLAY_URL.S : null,
      status: item.MATCH_STATUS.S,
    }));
  }

  for (let i = 0; i < matchDataPlayerTwo.length; i += 1) {
    if (matchDataPlayerTwo[i].outcome === 'team1') {
      matchDataPlayerTwo[i].outcome = 'LOSS';
    } else if (matchDataPlayerTwo[i].outcome === 'team2') {
      matchDataPlayerTwo[i].outcome = 'WIN';
    }
  }

  const matchData = matchDataPlayerOne.concat(matchDataPlayerTwo);
  // sort matchData by id
  const sortedMatchData = matchData.sort(
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10),
  );

  // filter out matches that are tournaments
  const filteredMatchData = sortedMatchData.filter(
    (match) => match.type !== 'tournament',
  );

  return res.status(200).json(filteredMatchData);
}
