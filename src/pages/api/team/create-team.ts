import {
    DynamoDB,
    DynamoDBClientConfig,
    GetItemCommand,
    UpdateItemCommand,
    PutItemCommand,
  } from '@aws-sdk/client-dynamodb';
  import { DynamoDBDocument, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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
        const { user, teamName } = req.body;

      // check if team name exists
        const team = await client.send(
            new GetItemCommand({
            TableName: process.env.AWS_TABLE_NAME,
            Key: {
                pk: { S: "team:"+teamName},
                sk: { S: "team:"+teamName},
            },
            }),
        );

        if (team.Item) {
            return res.status(400).json({ message: 'Team name already exists' });
        }
        else {
            // add team to table
            const team = await client.send(
                new PutCommand({
                TableName: process.env.AWS_TABLE_NAME,
                Item: {
                    pk: "team:"+teamName,
                    sk: "team:"+teamName,
                    record_type: "team",
                    name: teamName,
                    members: [user],
                    bracket: "beginner",
                },
                }),
            );

            // add team field to user
            const updatedUser = await client.send(
                new UpdateCommand({
                TableName: process.env.AWS_TABLE_NAME,
                Key: {
                    pk: "user:"+user,
                    sk: "user:"+user,
                },
                UpdateExpression: "SET team = :team",
                ExpressionAttributeValues: {
                    ":team": teamName,
                },
                }),
            );

            res.status(200).json({ teamName });
        }
    
    } catch (err) {
      console.log(err);
      return res.status(400).json({ message: err });
    }
  }
  