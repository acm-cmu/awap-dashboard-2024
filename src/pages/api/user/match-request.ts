import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  DynamoDB,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand } from '@aws-sdk/lib-dynamodb';

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
  if (req.method !== 'POST')
    return res.status(405).send({ message: 'Method not allowed' });

  const { player, opp, map } = req.body;

  if (!player || !opp) {
    return res
      .status(400)
      .send({ message: 'Error creating match request', error: 'No player' });
  }

  // query for active_version of player and opp

  // if active_version is not set, return error

  const playerInfo = await client.send(
    new GetCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: `team:${player}`,
        sk: `team:${player}`,
      },
      ProjectionExpression: 'active_version',
    }),
  );

  const oppInfo = await client.send(
    new GetCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: `team:${opp}`,
        sk: `team:${opp}`,
      },
      ProjectionExpression: 'active_version',
    }),
  );

  if (!playerInfo.Item || !oppInfo.Item)
    return res
      .status(400)
      .send({ message: 'Error creating match request', error: 'No player bot' });

  if (!playerInfo.Item.active_version || !oppInfo.Item.active_version)
    return res.status(400).send({
      message: 'Either you or your opponent does not have an active bot',
      error: 'Player bot not active',
    });

  let matchRequestData = {};

  if (map) {
    matchRequestData = {
      players: [{ username: player }, { username: opp }],
      mapId: map,
      shuffler: 'random',
    };
  } else {
    matchRequestData = {
      players: [{ username: player }, { username: opp }],
      shuffler: 'random',
    };
  }

  try {
    const response = await axios.post(
      `${process.env.MATCHMAKING_SERVER_IP}/match/new`,
      matchRequestData,
    );

    if (response.status !== 200)
      return res
        .status(500)
        .send({ message: 'Error starting match', data: response.data });

    return res.status(200).send({ message: 'Success', data: response.data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: 'Error fetching data',
      error: 'Internal Error, please try again later',
    });
  }
}
