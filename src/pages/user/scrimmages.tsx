import { UserLayout } from '@layout';
import {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSideProps,
} from 'next';
import { useSession } from 'next-auth/react';
import useSWR, { preload } from 'swr';
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
import axios, { AxiosError, AxiosResponse } from 'axios';
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
  const requestMatch = async () => {
    console.log('request sent');
    axios
      .post('/api/user/match-request', {
        player: playerTeam,
        opp: oppTeam.name,
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          console.log('request sent');
          toast.success('Match Request Sent!');
        }
        // Handle response
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Error sending match request');
          // Handle else
        }
        console.log(reason.message);
      });
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

const ScrimmageRequestDropdown: React.FC<{
  teams: Team[];
  username: string;
  setCurrentTeamSearch: React.Dispatch<React.SetStateAction<Team | null>>;
}> = ({ teams, username, setCurrentTeamSearch }) => {
  const [TeamValue, setValue] = useState(null);

  const teamnames = teams.map((team: Team) => team.name);
  const index = teamnames.indexOf(username);
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
        renderInput={(params) => <TextField {...params} label="Teams" />}
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
  );
};

const ScrimmagesTable: React.FC<{ data: Match[] }> = ({ data }) => (
  <Table striped bordered hover>
    <thead>
      <tr>
        <th>Match ID</th>
        <th>Opponent</th>
        <th>Status</th>
        <th>Outcome</th>
        <th>Type</th>
        <th>Replay</th>
      </tr>
    </thead>
    <TableBody data={data} />
  </Table>
);

// Scrimmages Page
const Scrimmages: NextPage = ({
  matchData,
  teams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data, status } = useSession({ required: true });
  const [CurrentTeamSearch, setCurrentTeamSearch] = useState(null);
  const [MatchData, setMatchData] = useState(matchData);

  const fetcher = async (url) => axios.get(url).then((res) => res.data);

  const { data: newMatchData, error } = useSWR(
    '/api/user/match-history',
    fetcher,
  );

  useEffect(() => {
    if (newMatchData) {
      console.log('new match data');
      setMatchData(newMatchData);
    }
  }, [newMatchData]);

  if (error) <p>Loading failed...</p>;
  if (status === 'loading' || !data || !data.user?.name)
    return <div>Loading...</div>;

  return (
    <UserLayout>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Available Scrimmages</Card.Title>
          <ScrimmageRequestDropdown
            teams={teams}
            username={data.user?.name}
            setCurrentTeamSearch={setCurrentTeamSearch}
          />
        </Card.Body>
      </Card>
      {CurrentTeamSearch && (
        <TeamInfo oppTeam={CurrentTeamSearch} playerTeam={data.user.name} />
      )}
      <Card>
        <Card.Body>
          <Card.Title>Scrimmage History</Card.Title>
          <ScrimmagesTable data={MatchData} />
        </Card.Body>
      </Card>
    </UserLayout>
  );
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
