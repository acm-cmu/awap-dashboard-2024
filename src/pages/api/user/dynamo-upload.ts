import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  UpdateItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
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
    res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uploadedName, user, fileName, timeStamp } = req.body;
    const s = process.env.S3_URL_TEMPLATE;
    const s3url = s + fileName;
    const primarykey = `team:${user}`;
    const sortkey = `team:${user}#bot:${fileName}`;
    const teamUser = await client.send(
      new GetItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: { S: primarykey },
          sk: { S: primarykey },
        },
      }),
    );
    client.send(
      new PutItemCommand({
        TableName: process.env.AWS_TABLE_NAME,
        Item: {
          pk: { S: primarykey },
          sk: { S: sortkey },
          record_type: { S: 'bot' },
          s3_key: { S: fileName },
          upload_name: { S: uploadedName },
          timeStamp: { S: timeStamp },
        },
      }),
    );

    if (!teamUser.Item) {
      client.send(
        new PutItemCommand({
          TableName: process.env.AWS_TABLE_NAME,
          Item: {
            pk: { S: primarykey },
            sk: { S: primarykey },
            record_type: { S: 'team' },
            name: { S: user },
            active_version: { S: fileName },
          },
        }),
      );
    } else {
      client.send(
        new UpdateItemCommand({
          TableName: process.env.AWS_TABLE_NAME,
          Key: {
            pk: { S: primarykey },
            sk: { S: primarykey },
          },
          UpdateExpression: 'SET active_version = :bot_file_name',
          ExpressionAttributeValues: {
            ':bot_file_name': { S: fileName },
          },
          ReturnValues: 'UPDATED_NEW',
        }),
      );
    }
    res.status(200).json({ s3url });
  } catch (err) {
    res.status(400).json({ message: err });
  }
}
