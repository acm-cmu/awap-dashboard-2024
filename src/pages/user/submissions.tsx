/* eslint-disable react/jsx-key */
import type { NextPage } from 'next';
import Image from 'next/image';
import { UserLayout } from '@layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Button, Card, Dropdown } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import { v4 as uuidv4 } from 'uuid';

import {
  DynamoDB,
  DynamoDBClientConfig,
  GetItemCommand,
  GetItemCommandInput,
  UpdateItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { DynamoDBDocument, QueryCommand, QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

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
    convertEmptyValues: true,
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

const TableRow: React.FC<{ submission: any; image: string }> = ({
  submission,
  image,
}) => (
  <tr className="align-middle">
    <td className="text-center">
      <div className="avatar avatar-md d-inline-flex position-relative">
        <Image
          fill
          className="rounded-circle"
          src={`/assets/avatars/avatar_${image}.jpg`}
          alt="profile pic"
        />
        <span className="avatar-status position-absolute d-block bottom-0 end-0 bg-success rounded-circle border border-white" />
      </div>
    </td>
    <td>
      <div>
        <a href={submission.submissionURL} target="_blank" rel="noreferrer">
          {submission.fileName}
        </a>
      </div>
    </td>

    <td>
      <div className="small text-black-50" />
      <div className="fw-semibold">{submission.timeStamp}</div>
    </td>
    <td>
      <div className="small text-black-50" />
      <div className="fw-semibold">{submission.isActive ? "Active" : "Inactive"}</div>
    </td>
  </tr>
);

const TableBody: React.FC<{ data: any; image: string }> = ({ data, image }) => (
  <tbody>
    {data.map((item: any) => (
      <TableRow submission={item} image={image}/>
    ))}
  </tbody>
);

const BotsDropdown: React.FC<{
  bots: Submission[];
  username: string;
}> = ({ bots, username}) => {
  const [ActiveBot, setValue] = useState<string | null>(null);

  const onActivate = () => {

    for (let i = 0; i < bots.length; i += 1) {
      if (bots[i].fileName === ActiveBot) {
        client.send(
          new UpdateItemCommand({
            TableName: process.env.AWS_TABLE_NAME,
            Key: {
              pk: { S: "team:" + session.user.name},
              sk: { S: "team:" + session.user.name},
            },
            UpdateExpression: 'SET active_version = :bot_file_name',
            ExpressionAttributeValues: {
              ':bot_file_name': { S: bots[i].s3Key },
            },
          }),
        );
        return;
      }
    }

  };

  const botNames = bots.map((bots) => bots.fileName);

  return (
    <div style={{ display: 'flex' }}>
      <Autocomplete
        disablePortal
        value={ActiveBot}
        onChange={(event: any, newBot: string | null) => {
          setValue(newBot);
        }}
        id="bots_dropdown"
        options={botNames}
        sx={{ width: 800 }}
        renderInput={(params) => <TextField {...params} label="Bots" />}
      />
      <Button
        variant="primary"
        style={{ marginLeft: 10 }}
        onClick={onActivate}
        size="lg"
      >
        Activate
      </Button>
    </div>
  );
};

const Submissions: NextPage = ({
  submissionData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { status, data: userData } = useSession();

  const [file, setFile] = useState<any>(null);
  // const { status, data } = useSession()

  const uploadFile = async (user: string) => {
    if (!file) return;
    const time1 = new Date().toLocaleString();
    const time2 = time1.split('/').join('-');
    const time = time2.split(' ').join('');
    const submissionID = uuidv4();
    const fileName = `bot-${user}-${time}-${submissionID}.py`;
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
      timeStamp: time1,
      submissionID,
    });
    window.location.reload();
    setFile(null);
  };

  const handleUploadClick = async () =>
    uploadFile(userData?.user.name as string);

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    let image = '';
    if (!userData.user.image) image = '0';
    else image = userData.user.image;

    return (
      <UserLayout>
        <div className="row">
          <div className="col-md-12">
            <Card className="mb-4">
              <Card.Header>Upload Submission</Card.Header>
              <Card.Body>
                <input
                  type="file"
                  name="image"
                  id="selectFile"
                  onChange={(e: any) => setFile(e.target.files[0])}
                />

                <Button onClick={handleUploadClick}>Upload</Button>
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Available Scrimmages</Card.Title>
                <BotsDropdown
                  bots={submissionData}
                  username={userData?.user.name!}
                />
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card className="mb-4">
              <Card.Header>Previous Submissions</Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table border mb-0">
                    <thead className="table-light fw-semibold">
                      <tr className="align-middle">
                        <th className="text-center">
                          <FontAwesomeIcon icon={faUsers} fixedWidth />
                        </th>
                        <th>Uploaded File Name</th>
                        {/* <th className="text-center">Successful</th> */}
                        <th>Time Submitted</th>
                        <th>Active Version</th>
                      </tr>
                    </thead>
                    <TableBody data={submissionData} image={image} />
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

  const queryParams: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': "team:" + session.user.name,
      ':sk': "team:" + session.user.name + "#bot"
    },
  };


  const command = new QueryCommand(queryParams);
  const queryResult = await client.send(command);
  if (!queryResult.Items || !queryResult.Items[0]) {
    return {
      props: { submissionData: [] },
    };
  }

  const userData = queryResult.Items;

  /* run a GetItem command to search with primary key team:teamname and sort key team:teamname */

  const getItemParams: GetItemCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    Key: {
      pk: {S : "team:" + session.user.name},
      sk: {S : "team:" + session.user.name}
    },
    ProjectionExpression: "active_version"
  };

  const getItemCommand = new GetItemCommand(getItemParams);
  const getItemResult = await client.send(getItemCommand);
  if (!getItemResult || !getItemResult.Item) {
    return {
      props: {
        submissionData: [],
      },
    };
  }
  const activeVersion = getItemResult.Item.active_version.S ? getItemResult.Item.active_version.S : "";

  console.log("active version: " + activeVersion)


  const submissionData: Submission[] = [];
  const numSubmissions = userData.length;

  const sorted = userData
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
      submissionURL: process.env.S3_URL_TEMPLATE + sorted[i].s3_key as string,
      timeStamp: sorted[i].timeStamp as string,
      isActive: (sorted[i].s3_key === activeVersion) as boolean,
    };
    submissionData.push(submission);
  }


  return {
    props: { submissionData },
  };
};
export default Submissions;
