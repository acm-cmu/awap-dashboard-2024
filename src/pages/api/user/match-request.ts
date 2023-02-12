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
    convertEmptyValues: true,
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

  const { player } = req.body;
  const { opp } = req.body;

  const params: QueryCommandInput = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX1,
    KeyConditionExpression: 'TEAM_1 = :team_name ',
    ExpressionAttributeValues: {
      ':team_name': { S: player },
      ':status': { S: 'pending' },
      ':opp': { S: opp },
    },
    FilterExpression: 'MATCH_STATUS = :status and TEAM_2 = :opp',
  };

  const queryCommand = new QueryCommand(params);
  const queryResult: QueryCommandOutput = await client.send(queryCommand);

  if (queryResult.Items?.length) {
    const matchTimeData = queryResult.Items.map((item: any) => ({
      status: item.MATCH_STATUS.S,
      last_updated: item.LAST_UPDATED.S,
      id: item.MATCH_ID.N,
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

  const playerData = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_PLAYER_TABLE_NAME,
      Key: {
        team_name: { S: player },
      },
    }),
  );

  const playerBotName = playerData.Item?.current_submission_id.S;

  const oppData = await client.send(
    new GetItemCommand({
      TableName: process.env.AWS_PLAYER_TABLE_NAME,
      Key: {
        team_name: { S: opp },
      },
    }),
  );

  const oppBotName = oppData.Item?.current_submission_id.S;

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
