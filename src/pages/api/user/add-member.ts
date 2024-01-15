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
    console.log("entered bracket change handler")
    try {
      const { user, newUser, teamName } = req.body;
    //   console.log("new bracket" + bracket)
      console.log("team" + teamName)
      // const submission_id = user + timeStamp;
      // const team = await client.send(
      //   new GetItemCommand({
      //     TableName: process.env.AWS_TABLE_NAME,
      //     Key: {
      //       pk: { S: "team:"+ teamName},
      //       sk: { S: "team:"+ teamName},
      //     },
      //   }),
      // );
  
      // if (!team.Item) {
      //   client.send(
      //     new PutItemCommand({
      //       TableName: process.env.AWS_TABLE_NAME,
      //       Item: {
      //         pk: { S: "team:"+ teamName},
      //         sk: { S: "team:"+ teamName},
      //         record_type: { S: "team"},
      //         bracket: { S: bracket },
      //       },
      //     }),
      //   );
      // } else {
        client.send(
          new UpdateItemCommand({
            TableName: process.env.AWS_TABLE_NAME,
            Key: {
              pk: { S: "user:"+ newUser},
              sk: { S: "user:"+ newUser},
            },
            UpdateExpression: 'SET team = :team',
            ExpressionAttributeValues: {
              ':team': { S: teamName },
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
      // }
      res.status(200).json({ newUser });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: err });
    }
  }
  