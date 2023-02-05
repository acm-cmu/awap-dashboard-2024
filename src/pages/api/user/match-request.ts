import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
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

  try {
    const { player } = req.body;
    const { opp } = req.body;

    console.log(`Player: ${player}`);
    console.log(`Opponent: ${opp}`);

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
        .status(500)
        .send({ message: 'Error fetching data', error: 'No bot found' });
    }

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

    console.log(requestData);

    // make post request to matchmaker at match endpoint
    // with player_bot_name and opp_bot_name
    // matchmaker will return match_id
    // update player and opp with match_id

    const response = await axios.post('http://52.23.23.233:8000/match/', {
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
    });

    console.log(`Status: ${response.status}`);
    if (response.status !== 200) {
      return res
        .status(500)
        .send({ message: 'Error fetching data', error: response.error });
    }
    return res.status(200).send({ message: 'Success', data: response.data });
  } catch (err) {
    return res.status(500);
  }
}
