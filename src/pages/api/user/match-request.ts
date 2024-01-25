import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
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
    return res.status(405).send({ message: 'Method not allowed' });
  }

  const { player, opp } = req.body;

  console.log(player, opp);

  if (!player || !opp) {
    return res
      .status(400)
      .send({ message: 'Error creating match request', error: 'No player' });
  }

  /*
  const params: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: process.env.AWS_REVERSE_INDEX,
    KeyConditionExpression: 'sk = :team_name and begins_with(pk, :pk)',
    FilterExpression: 'item_status = :status and contains(players, :opp)',
    ExpressionAttributeValues: {
      ':team_name': { S: `team:${player}`},
      ':pk': { S: "match:" },
      ':status': { S: 'PENDING' },
      ':opp': { S: `team:${opp}` },
    },
  };

  const queryCommand = new QueryCommand(params);
  const queryResult: QueryCommandOutput = await client.send(queryCommand);

  if (queryResult.Items?.length) {
    const matchTimeData = queryResult.Items.map((item: any) => ({
      status: item.item_status.S,
      last_updated: item.timestamp.S,
      id: item.match_id.N,
    }));

    // check if last_updated is less than 30 minutes ago
    for (let i = 0; i < matchTimeData.length; i += 1) {
      if (matchTimeData[i].status === 'pending') {
        const lastUpdated = new Date(matchTimeData[i].last_updated);
        // console.log(lastUpdated);
        const now = Date.now();
        const diff = now - lastUpdated.getTime();
        const diffMinutes = Math.round(diff / 60000);

        if (diffMinutes < 30) {
          return res.status(412).send({
            message: 'Error creating match request',
            error:
              'A pending match request already exists, please try again later',
          });
        }
      }
    }
  }
  */

  const playerData = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: {S : "team:" + player},
        sk: {S : "team:" + player}
      },
      ProjectionExpression: "active_version"
    }),
  );

  const playerBotName = playerData.Item?.active_version?.S;

  const oppData = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: {S : "team:" + opp},
        sk: {S : "team:" + opp}
      },
      ProjectionExpression: "active_version"
    }),
  );

  const oppBotName = oppData.Item?.active_version?.S;

  if (!playerBotName || !oppBotName) {
    return res
      .status(400)
      .send({ message: 'Error fetching data', error: 'No bot found' });
  }

  // make post request to matchmaker at match endpoint
  // with player_bot_name and opp_bot_name
  // matchmaker will return match_id
  // update player and opp with match_id

  const requestData = {
    game_engine_name: process.env.GAME_ENGINE_NAME,
    num_players: 2,
    user_submissions: [
      {
        username: player,
        s3_bucket_name: process.env.S3_UPLOAD_BUCKET,
        s3_object_name: playerBotName,
      },
      {
        username: opp,
        s3_bucket_name: process.env.S3_UPLOAD_BUCKET,
        s3_object_name: oppBotName,
      },
    ],
  };

  // console.log(requestData);

  try {
    const response = await axios.post(
      `http://${process.env.MATCHMAKING_SERVER_IP}/match/`,
      requestData,
    );

    // console.log(`Status: ${response.status}`);

    if (response.status !== 200) {
      return res
        .status(500)
        .send({ message: 'Error fetching data', data: response.data });
    }
    return res.status(200).send({ message: 'Success', data: response.data });
  } catch (err) {
    return res.status(500).send({
      message: 'Error fetching data',
      error: 'Internal Error, please try again later',
    });
  }
}
