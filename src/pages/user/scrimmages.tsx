import { UserLayout } from '@layout';
import {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSideProps,
} from 'next';
import { useSession } from 'next-auth/react';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

import {
  DynamoDB,
  DynamoDBClientConfig,
  QueryCommand,
  QueryCommandOutput,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocument,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
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
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

interface Match {
  id: string;
  player: string;
  opponent: string;
  outcome: string;
  type: string;
  replay: string;
  status: string;
}

interface Team {
  name: string;
  rating: number;
}

// Table Component
const TableRow: React.FC<{ match: Match }> = ({ match }) => (
  <tr>
    <td>{match.id}</td>
    <td>{match.opponent}</td>
    <td>{match.status}</td>
    <td>{match.outcome}</td>
    <td>{match.type}</td>
    <td>{match.replay}</td>
  </tr>
);

const TableBody: React.FC<{ data: Match[] }> = ({ data }) => (
  <tbody>
    {data.map((item: Match) => (
      <TableRow match={item} />
    ))}
  </tbody>
);

// Team Info Component Card and button to request match
const TeamInfo: React.FC<{ oppTeam: Team; playerTeam: string }> = ({
  oppTeam,
  playerTeam,
}) => {
  // make api request to fastapi

  const requestMatch = async () => {
    console.log('request match');
    toast.success('Match Request Sent!');
    // get status from axios post request

    try {
      const response = await axios.post('/api/user/match-request', {
        player: playerTeam,
        opp: oppTeam.name,
      });
      console.log(response);
      if (response.status === 200) {
        toast.success('Match Request Sent!');
      } else {
        toast.error('Error sending match request');
      }
    } catch (error) {
      toast.error('Error sending match request');
      console.log(error);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>{oppTeam.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted" />
        <Card.Text>Rating: {oppTeam.rating}</Card.Text>
        <Button variant="primary" onClick={requestMatch}>
          Request Match
        </Button>
      </Card.Body>
    </Card>
  );
};

// Scrimmages Page
const Scrimmages: NextPage = ({
  matchData,
  teams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data, status } = useSession();
  const [TeamValue, setValue] = useState(null);
  const [CurrentTeamSearch, setCurrentTeamSearch] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') Router.replace('/auth/login');
  }, [status]);

  if (status === 'authenticated') {
    const teamnames = teams.map((team: Team) => team.name);
    const index = teamnames.indexOf(data.user.name);
    if (index > -1) teamnames.splice(index, 1);

    const onSearch = () => {
      // get value from autocomplete
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].name === TeamValue) {
          setCurrentTeamSearch(teams[i]);
          return;
        }
      }
    };

    return (
      <UserLayout>
        <Card className="mb-3">
          <Card.Body>
            <Card.Title>Available Scrimmages</Card.Title>
            <div style={{ display: 'flex' }}>
              <Autocomplete
                disablePortal
                value={TeamValue}
                onChange={(event: any, newTeamValue: string | null) => {
                  setValue(newTeamValue);
                }}
                id="teams_dropdown"
                options={teamnames}
                sx={{ width: 800 }}
                renderInput={(params) => (
                  <TextField {...params} label="Teams" />
                )}
              />
              <Button
                variant="primary"
                style={{ marginLeft: 10 }}
                onClick={onSearch}
                size="lg"
              >
                Search
              </Button>
            </div>
          </Card.Body>
        </Card>
        {/* Create card that displays only if search button is clicked */}
        {CurrentTeamSearch && (
          <TeamInfo oppTeam={CurrentTeamSearch} playerTeam={data.user.name} />
        )}
        <Card>
          <Card.Body>
            <Card.Title>Scrimmage History</Card.Title>
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Opponent</th>
                  <th>Status</th>
                  <th>Winner</th>
                  <th>Type</th>
                  <th>Replay</th>
                </tr>
              </thead>
              <TableBody data={matchData} />
            </Table>
          </Card.Body>
        </Card>
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

  // if user is logged in, query match data from dynamodb index
  // TODO: Add query for user's team
  const paramsOne: QueryCommandInput = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX1,
    KeyConditionExpression: 'TEAM_1 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: session.user.name },
    },
  };

  const commandOne = new QueryCommand(paramsOne);
  const resultPlayerOne: QueryCommandOutput = await client.send(commandOne);

  let matchDataPlayerOne: Match[] = [];

  if (resultPlayerOne.Items) {
    matchDataPlayerOne = resultPlayerOne.Items.map((item: any) => ({
      id: item.MATCH_ID.N,
      player: item.TEAM_1.S,
      opponent: item.TEAM_2.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      replay: item.REPLAY_FILENAME.S,
      status: item.MATCH_STATUS.S,
    }));
  }

  const paramsTwo: QueryCommandInput = {
    TableName: process.env.AWS_MATCH_TABLE_NAME,
    IndexName: process.env.AWS_MATCH_TABLE_INDEX2,
    KeyConditionExpression: 'TEAM_2 = :team_name',
    ExpressionAttributeValues: {
      ':team_name': { S: session.user.name },
    },
  };

  const commandTwo = new QueryCommand(paramsTwo);
  const resultPlayerTwo: QueryCommandOutput = await client.send(commandTwo);

  let matchDataPlayerTwo: Match[] = [];

  if (resultPlayerTwo.Items) {
    matchDataPlayerTwo = resultPlayerTwo.Items.map((item: any) => ({
      id: item.MATCH_ID.N,
      player: item.TEAM_1.S,
      opponent: item.TEAM_2.S,
      outcome: item.OUTCOME.S,
      type: item.MATCH_TYPE.S,
      replay: item.REPLAY_FILENAME.S,
      status: item.MATCH_STATUS.S,
    }));
  }
  const matchData = matchDataPlayerOne.concat(matchDataPlayerTwo);

  // scan player table for team names
  const teamScanParams: ScanCommandInput = {
    TableName: process.env.AWS_RATINGS_TABLE_NAME,
    ProjectionExpression: 'team_name, current_rating',
  };

  const commandThree = new ScanCommand(teamScanParams);
  const result = await client.send(commandThree);

  console.log(result.Items);

  let teams: Team[] = [];
  if (result.Items) {
    teams = result.Items.map((item: any) => ({
      name: item.team_name.S,
      rating: item.current_rating.N,
    }));
  }

  return {
    props: { matchData, teams }, // will be passed to the page component as props
  };
};

export default Scrimmages;
