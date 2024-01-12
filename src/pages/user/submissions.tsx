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
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { DynamoDBDocument, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { useSession } from 'next-auth/react';
import Router from 'next/router';

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
  submissionURL: string;
  timeStamp: string;
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
      <Dropdown align="end">
        <Dropdown.Toggle
          as="button"
          bsPrefix="btn"
          className="btn-link rounded-0 text-black-50 shadow-none p-0"
          id="action-user1"
        >
          <FontAwesomeIcon fixedWidth icon={faEllipsisVertical} />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item href="#/action-1">Info</Dropdown.Item>
          <Dropdown.Item href="#/action-2">Edit</Dropdown.Item>
          <Dropdown.Item className="text-danger" href="#/action-3">
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </td>
  </tr>
);

const TableBody: React.FC<{ data: any; image: string }> = ({ data, image }) => (
  <tbody>
    {data.map((item: any) => (
      <TableRow submission={item} image={image} />
    ))}
  </tbody>
);

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
                        <th aria-label="Action" />
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

  const params: ScanCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    FilterExpression: 'pk = :team_name AND record_type = :bot',
    ExpressionAttributeValues: {
      ':team_name': { S: ("team:" + session.user.name) },
      ':bot': { S: "bot" }
    },
  };

  const command = new ScanCommand(params);
  const result = await client.send(command);
  if (!result.Items || !result.Items[0]) {
    return {
      props: {
        submissionData: [],
      },
    };
  }

  const userData = result.Items;
  const submissionData: Submission[] = [];
  const numSubmissions = userData.length;

  const sorted = userData
    .sort((a, b) => {
      if (a.timeStamp.S === undefined) return 1;
      if (b.timeStamp.S === undefined) return -1;
      if (a.timeStamp.S === b.timeStamp.S) return 0;
      return a.timeStamp.S > b.timeStamp.S ? 1 : -1;
    })
    .reverse();
  for (let i = 0; i < numSubmissions; i += 1) {
    const submission: Submission = {
      fileName: sorted[i].upload_name.S as string,
      submissionURL: process.env.S3_URL_TEMPLATE + sorted[i].s3_key.S as string,
      timeStamp: sorted[i].timeStamp.S as string,
    };
    submissionData.push(submission);
  }

  return {
    props: { submissionData }, // will be passed to the page component as props
  };
};
export default Submissions;
