/* eslint-disable react/jsx-key */
import type { NextPage } from 'next';
import Image from 'next/image';
import { UserLayout } from '@layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { Button, Card } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { useSession } from 'next-auth/react';
import Router from 'next/router';

import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';
import { toast } from 'react-toastify';

// Dynamo DB Config
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
interface Submission {
  fileName: string;
  s3Key: string;
  submissionURL: string;
  timeStamp: string;
  isActive: boolean;
}

interface ConfigData {
  disabled_bracket_switching: boolean;
  disabled_team_modifications: boolean;
  disabled_scrimmage_requests: boolean;
  disabled_code_submissions: boolean;
}

const TableRow: React.FC<{
  submission: any;
  image: string;
  activateFn: any;
}> = ({ submission, image, activateFn }) => (
  <tr className='align-middle'>
    <td className='text-center'>
      <div className='avatar avatar-md d-inline-flex position-relative'>
        <Image
          fill
          className='rounded-circle'
          src={`/assets/avatars/avatar_${image}.png`}
          alt='profile pic'
        />
        <span className='avatar-status position-absolute d-block bottom-0 end-0 bg-success rounded-circle border border-white' />
      </div>
    </td>
    <td>
      <div>
        <a href={submission.submissionURL} target='_blank' rel='noreferrer'>
          {submission.fileName}
        </a>
      </div>
    </td>

    <td>
      <div className='small text-black-50' />
      <div className='fw-semibold'>{submission.timeStamp}</div>
    </td>
    <td>
      <div className='small text-black-50' />
      <div className='fw-semibold'>
        {submission.isActive ? 'Active' : 'Inactive'}
      </div>
    </td>
    <td>
      <Button
        variant='outline-dark'
        onClick={() => activateFn(submission.s3Key)}
      >
        Activate
      </Button>
    </td>
  </tr>
);

const TableBody: React.FC<{ data: any; image: string; activateFn: any }> = ({
  data,
  image,
  activateFn,
}) => (
  <tbody>
    {data.map((item: any) => (
      <TableRow submission={item} image={image} activateFn={activateFn} />
    ))}
  </tbody>
);

const Submissions: NextPage = ({
  teamData,
  configData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data: userData } = useSession();
  const [file, setFile] = useState<any>(null);

  const { team, submissionData } = teamData;

  const handleActivate = async (fileName: string) => {
    if (configData.disabled_code_submissions) {
      toast.error('Changing active bot is currently disabled.');
      return;
    }

    await axios.post('/api/user/activate_bot', {
      team,
      fileName,
    });
    window.location.reload();
  };

  const uploadFile = async (user: string) => {
    if (!file) return;
    // if filename contains spaces or ':' reject
    if (file.name.includes(' ') || file.name.includes(':')) {
      toast.error('File name cannot contain spaces or colons.');
      return;
    }

    const time = new Date().toISOString();
    const timeString = time.split('.')[0].replace(/:/g, '-');

    const submissionID = uuidv4();
    const fileName = `bot-${user}-${timeString}-${submissionID}.py`;
    const { data } = await axios.post('/api/user/s3-upload', {
      name: fileName,
      type: file.type,
    });

    const fileUrl = data.url;
    await axios.put(fileUrl, file, {
      headers: {
        'Content-type': file.type,
        'Access-Control-Allow-Origin': '*',
      },
    });

    await axios.post('/api/user/dynamo-upload', {
      uploadedName: file.name,
      user,
      fileName,
      timeStamp: time,
      submissionID,
    });
    window.location.reload();
    setFile(null);
  };

  const handleUploadClick = async () => {
    if (configData.disabled_code_submissions) {
      toast.error('Code submissions are currently disabled.');
      return;
    }

    uploadFile(team);
  };

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    let image = '';
    if (!userData.user.image) image = '0';
    else image = userData.user.image;

    return (
      <UserLayout>
        <div className='row'>
          <div className='col-md-12'>
            <Card className='mb-4'>
              <Card.Header>Upload Submission</Card.Header>
              <Card.Body>
                <input
                  type='file'
                  name='image'
                  id='selectFile'
                  accept='.py'
                  onChange={(e: any) => setFile(e.target.files[0])}
                />

                <Button onClick={handleUploadClick} variant='dark'>
                  Upload
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className='row'>
          <div className='col-md-12'>
            <Card className='mb-4'>
              <Card.Header>Previous Submissions</Card.Header>
              <Card.Body>
                <div className='table-responsive'>
                  <table className='table border mb-0'>
                    <thead className='table-light fw-semibold'>
                      <tr className='align-middle'>
                        <th className='text-center'>
                          <FontAwesomeIcon icon={faUsers} fixedWidth />
                        </th>
                        <th>Uploaded File Name</th>
                        {/* <th className="text-center">Successful</th> */}
                        <th>Time Submitted</th>
                        <th>Active Version</th>
                        <th>Activate</th>
                      </tr>
                    </thead>
                    <TableBody
                      data={submissionData}
                      image={image}
                      activateFn={handleActivate}
                    />
                  </table>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </UserLayout>
    );
  }
  return <div>loading</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const result = await client.send(
    new GetCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: `user:${session.user.name}`,
        sk: `user:${session.user.name}`,
      },
    }),
  );

  if (!result || !result.Item || !result.Item.team) {
    return {
      redirect: {
        destination: '/team',
        permanent: false,
      },
    };
  }

  // query for config data
  const configParams: GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: 'config:config_profile_1',
      sk: 'config:config_profile_1',
    },
  };

  const configCommand = new GetCommand(configParams);
  const configResult = await client.send(configCommand);

  const configData = configResult.Item;

  let configs: ConfigData = {
    disabled_bracket_switching: false,
    disabled_code_submissions: false,
    disabled_scrimmage_requests: false,
    disabled_team_modifications: false,
  };

  if (configData) {
    configs = {
      disabled_bracket_switching: !configData.bracket_switching,
      disabled_code_submissions: !configData.code_submissions,
      disabled_scrimmage_requests: !configData.scrimmage_requests,
      disabled_team_modifications: !configData.team_modifications,
    };
  }

  const { team } = result.Item;

  const queryParams: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `team:${team}`,
      ':sk': `team:${team}#bot`,
    },
  };

  const command = new QueryCommand(queryParams);
  const queryResult = await client.send(command);
  if (!queryResult.Items || !queryResult.Items[0]) {
    return {
      props: {
        teamData: {
          team,
          submissionData: [],
        },
        configData: configs,
      },
    };
  }

  const teamData = queryResult.Items;

  /* run a GetItem command to search with primary key team:teamname and sort key team:teamname */

  const getItemParams: GetCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: `team:${team}`,
      sk: `team:${team}`,
    },
    ProjectionExpression: 'active_version',
  };

  const getItemCommand = new GetCommand(getItemParams);
  const getItemResult = await client.send(getItemCommand);
  if (!getItemResult || !getItemResult.Item) {
    return {
      props: {
        teamData: {
          team,
          submissionData: [],
        },
        configData: configs,
      },
    };
  }

  const activeVersion = getItemResult.Item.active_version
    ? getItemResult.Item.active_version
    : '';

  const submissionData: Submission[] = [];
  const numSubmissions = teamData.length;

  const sorted = teamData
    .sort((a, b) => {
      if (a.timeStamp === undefined) return 1;
      if (b.timeStamp === undefined) return -1;
      if (a.timeStamp === b.timeStamp) return 0;
      return a.timeStamp > b.timeStamp ? 1 : -1;
    })
    .reverse();

  for (let i = 0; i < numSubmissions; i += 1) {
    const submission: Submission = {
      fileName: sorted[i].upload_name as string,
      s3Key: sorted[i].s3_key,
      submissionURL: (process.env.S3_URL_TEMPLATE + sorted[i].s3_key) as string,
      timeStamp: new Date(sorted[i].timeStamp).toLocaleString('en-US'),
      isActive: (sorted[i].s3_key === activeVersion) as boolean,
    };
    submissionData.push(submission);
  }

  return {
    props: {
      teamData: {
        team,
        submissionData,
      },
      configData: configs,
    },
  };
};
export default Submissions;
