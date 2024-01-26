import {
  DynamoDB,
  DynamoDBClientConfig,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
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

  let requestData = {};

  const params: ScanCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    FilterExpression:
      'attribute_exists(active_version) and active_version <> :null',
    ExpressionAttributeValues: {
      ':null': { S: '' },
    },
  };

  const scanCommand = new ScanCommand(params);
  const scanResult: ScanCommandOutput = await client.send(scanCommand);

  if (!scanResult.Items?.length) {
    return res
      .status(400)
      .send({ message: 'Error fetching data', error: 'No players found' });
  }

  const playerData = scanResult.Items.filter((item: any) => item.name).map(
    (item: any) => ({
      username: item.name.S,
      s3_bucket_name: process.env.S3_UPLOAD_BUCKET,
      s3_object_name: item.active_version.S,
    }),
  );
  // console.log(playerData);

  requestData = {
    game_engine_name: process.env.GAME_ENGINE_NAME,
    user_submissions: playerData,
  };
  // console.log(requestData);
  try {
    const response = await axios.post(
      `http://${process.env.MATCHMAKING_SERVER_IP}/scrimmage/`,
      requestData,
    );

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
