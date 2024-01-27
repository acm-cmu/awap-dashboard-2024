import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
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

  const params: UpdateCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: { pk: 'config:config_profile_1', sk: 'config:config_profile_1' },
  };

  if (req.body.bracket_switching !== undefined) {
    const bracketSwitching = req.body.bracket_switching;

    params.UpdateExpression = 'SET #bracket_switching = :bracket_switching';
    params.ExpressionAttributeNames = {
      '#bracket_switching': 'bracket_switching',
    };
    params.ExpressionAttributeValues = {
      ':bracket_switching': bracketSwitching,
    };
  }

  if (req.body.team_modifications !== undefined) {
    const teamModifications = req.body.team_modifications;

    params.UpdateExpression = 'SET #team_modifications = :team_modifications';
    params.ExpressionAttributeNames = {
      '#team_modifications': 'team_modifications',
    };
    params.ExpressionAttributeValues = {
      ':team_modifications': teamModifications,
    };
  }

  if (req.body.scrimmage_requests !== undefined) {
    const scrimmageRequests = req.body.scrimmage_requests;

    params.UpdateExpression = 'SET #scrimmage_requests = :scrimmage_requests';
    params.ExpressionAttributeNames = {
      '#scrimmage_requests': 'scrimmage_requests',
    };
    params.ExpressionAttributeValues = {
      ':scrimmage_requests': scrimmageRequests,
    };
  }

  if (req.body.code_submissions !== undefined) {
    const codeSubmissions = req.body.code_submissions;

    params.UpdateExpression = 'SET #code_submissions = :code_submissions';
    params.ExpressionAttributeNames = {
      '#code_submissions': 'code_submissions',
    };
    params.ExpressionAttributeValues = {
      ':code_submissions': codeSubmissions,
    };
  }

  try {
    const response = await client.send(new UpdateCommand(params));
    if (response)
      return res
        .status(200)
        .send({ message: 'Permissions updated successfully!' });

    return res.status(400).send({ message: 'Error updating permissions!' });
  } catch (error) {
    return res.status(500).send({ message: 'Error updating permissions!' });
  }
}
