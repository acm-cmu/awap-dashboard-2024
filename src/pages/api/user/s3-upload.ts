import AWS from 'aws-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION_LOCAL,
  accessKeyId: process.env.AWS_ACCESS_KEY_LOCAL,
  secretAccessKey: process.env.AWS_SECRET_KEY_LOCAL,
  signatureVersion: 'v4',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, type } = req.body;
    const fileParams = {
      Bucket: process.env.S3_UPLOAD_BUCKET,
      Key: name,
      ContentType: type,
    };

    const url = await s3.getSignedUrlPromise('putObject', fileParams);
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ message: err });
  }
}
