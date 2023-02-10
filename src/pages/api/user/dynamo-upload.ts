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
    const { uploadedName, user, fileName, timeStamp } = req.body;
    const s = process.env.S3_URL_TEMPLATE;
    const s3url = s + fileName;
    // const submission_id = user + timeStamp;
    const teamUser = await client.send(
      new GetItemCommand({
        TableName: process.env.AWS_PLAYER_TABLE_NAME,
        Key: {
          team_name: { S: user },
        },
      }),
    );
    client.send(
      new PutItemCommand({
        TableName: process.env.AWS_SUBMISSIONS_TABLE_NAME,
        Item: {
          submission_id: { S: fileName },
          team_name: { S: user },
          bot_file_name: { S: fileName },
          uploaded_file_name: { S: uploadedName },
          current_submission_url: { S: s3url },
          timeStamp: { S: timeStamp },
        },
      }),
    );
    if (!teamUser.Item) {
      client.send(
        new PutItemCommand({
          TableName: process.env.AWS_PLAYER_TABLE_NAME,
          Item: {
            team_name: { S: user },
            current_submission_file_name: { S: fileName },
          },
        }),
      );
    } else {
      client.send(
        new UpdateItemCommand({
          TableName: process.env.AWS_PLAYER_TABLE_NAME,
          Key: {
            team_name: { S: user },
          },
          UpdateExpression: 'SET current_submission_id = :bot_file_name',
          ExpressionAttributeValues: {
            ':bot_file_name': { S: fileName },
          },
          ReturnValues: 'UPDATED_NEW',
        }),
      );
      // const prevSubs = teamUser.Item.PREVIOUS_SUBMISSION_URLS.SS;
      // const prevUploaded = teamUser.Item.UPLOADED_FILE_NAME.SS;
      // if (prevSubs && prevUploaded) {
      //   prevSubs.push(s3url);
      //   prevUploaded.push(uploadedName);

      //   client.send(
      //     new UpdateItemCommand({
      //       TableName: process.env.AWS_PLAYER_TABLE_NAME,
      //       Key: {
      //         TEAM_NAME: { S: user },
      //       },
      //       UpdateExpression:
      //         'SET BOT_FILE_NAME = :fileName, CURRENT_SUBMISSION_URL = :s2, PREVIOUS_SUBMISSION_URLS = :prevSubs, RATING = :rating, UPLOADED_FILE_NAME = :uploadedName',
      //       ExpressionAttributeValues: {
      //         ':fileName': { S: fileName },
      //         ':s2': { S: s3url },
      //         ':rating': { N: '2' },
      //         ':prevSubs': { SS: prevSubs },
      //         ':uploadedName': { SS: prevUploaded },
      //       },
      //       ReturnValues: 'UPDATED_NEW',
      //     }),
      //   );
      // }
    }
    res.status(200).json({ s3url });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
}
