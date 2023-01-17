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
    res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { player } = req.query;
    const { opp } = req.query;

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

    // make post request to matchmaker at match endpoint
    // with player_bot_name and opp_bot_name
    // matchmaker will return match_id
    // update player and opp with match_id

    const { data } = await axios.post('http://localhost:8000/match', {
      game_engine_name: process.env.GAME_ENGINE_NAME,
      num_players: 2,
      user_submissions: [
        {
          username: player,
          s3_bucket_name: process.env.S3_BOT_BUCKET,
          s3_object_name: playerBotName,
        },
        {
          username: opp,
          s3_bucket_name: process.env.S3_BOT_BUCKET,
          s3_object_name: oppBotName,
        },
      ],
    });

    if (data.error) {
      res
        .status(500)
        .json({ message: 'Error fetching data', error: data.error });
    } else res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching data', error: err });
  }
}
