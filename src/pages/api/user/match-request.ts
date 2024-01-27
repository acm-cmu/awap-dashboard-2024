import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).send({ message: 'Method not allowed' });

  const { player, opp, map } = req.body;

  if (!player || !opp) {
    return res
      .status(400)
      .send({ message: 'Error creating match request', error: 'No player' });
  }

  let matchRequestData = {};

  if (map) {
    matchRequestData = {
      players: [{ username: player }, { username: opp }],
      map,
      shuffler: 'random',
    };
  } else {
    matchRequestData = {
      players: [{ username: player }, { username: opp }],
      shuffler: 'random',
    };
  }

  try {
    const response = await axios.post(
      `${process.env.MATCHMAKING_SERVER_IP}/match/new`,
      matchRequestData,
    );

    if (response.status !== 200)
      return res
        .status(500)
        .send({ message: 'Error starting match', data: response.data });

    return res.status(200).send({ message: 'Success', data: response.data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: 'Error fetching data',
      error: 'Internal Error, please try again later',
    });
  }
}
