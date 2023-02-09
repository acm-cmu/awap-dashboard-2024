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
  replay: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session || !session.user) {
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
      replay: item.REPLAY_URL.S,
      status: item.MATCH_STATUS.S,
    }));
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
      player: item.TEAM_1.S,
      opponent: item.TEAM_2.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      replay: item.REPLAY_URL.S,
      status: item.MATCH_STATUS.S,
    }));
  }
  const matchData = matchDataPlayerOne.concat(matchDataPlayerTwo);
  matchData.reverse();
  return res.status(200).json(matchData);
}
