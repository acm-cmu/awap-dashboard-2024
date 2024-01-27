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

  try {
    const response = await axios.post(`${process.env.MATCHMAKING_SERVER_IP}/scrimmage/new`);

    if (response.status !== 200) {
      return res
        .status(500)
        .send({ message: 'Error Requesting Ranked Scrimmages', data: response.data });
    }
    return res.status(200).send({ message: 'Success', data: response.data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: 'Error fetching data',
      error: 'Internal Error, please try again later',
    });
  }
}
