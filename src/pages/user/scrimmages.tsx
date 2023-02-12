/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-one-expression-per-line */
import { UserLayout } from '@layout';
import {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSideProps,
} from 'next';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';

import {
  DynamoDB,
  DynamoDBClientConfig,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { DynamoDBDocument, ScanCommandInput } from '@aws-sdk/lib-dynamodb';

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
    <td>
      {match.status === 'finished' ? (
        <a href={match.replay}>Download</a>
      ) : (
        'N/A'
      )}
    </td>
  </tr>
);

const TableBody: React.FC<{ data: Match[] }> = ({ data }) => (
  // eslint-disable-next-line react/jsx-key
  <tbody>{data && data.map((item: Match) => <TableRow match={item} />)}</tbody>
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
      })
      .catch((reason: AxiosError) => {
        if (reason.response!.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
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
  const [TeamValue, setValue] = useState<string | null>(null);

  const teamnames = teams.map((team: Team) => team.name);
  const index = teamnames.indexOf(username);
  if (index > -1) teamnames.splice(index, 1);

  const onSearch = () => {
    // get value from autocomplete
    for (let i = 0; i < teams.length; i += 1) {
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
  <Table striped bordered hover className="text-center">
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
  teams,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession({ required: true });
  const [CurrentTeamSearch, setCurrentTeamSearch] = useState<Team | null>(null);

  const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

  const {
    data: MatchData,
    error,
    mutate,
  } = useSWR('/api/user/match-history', fetcher);

  if (error) <p>Loading failed...</p>;
  if (
    session.status === 'loading' ||
    !session.data ||
    !session.data.user?.name
  ) {
    return <div>Loading...</div>;
  }

  return (
    <UserLayout>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Available Scrimmages</Card.Title>
          <ScrimmageRequestDropdown
            teams={teams}
            username={session.data.user?.name}
            setCurrentTeamSearch={setCurrentTeamSearch}
          />
        </Card.Body>
      </Card>
      {CurrentTeamSearch && (
        <TeamInfo
          oppTeam={CurrentTeamSearch}
          playerTeam={session.data.user.name}
        />
      )}
      <Card>
        <Card.Body>
          <Card.Title>Scrimmage History</Card.Title>
          <Button
            variant="primary"
            className="mb-3"
            onClick={async () => {
              mutate();
            }}
          >
            Refresh
          </Button>
          <ScrimmagesTable data={MatchData} />
        </Card.Body>
      </Card>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // scan player table for team names
  const teamScanParams: ScanCommandInput = {
    TableName: process.env.AWS_RATINGS_TABLE_NAME,
    ProjectionExpression: 'team_name, current_rating',
  };

  const command = new ScanCommand(teamScanParams);
  const result = await client.send(command);

  let teams: Team[] = [];
  if (result.Items) {
    teams = result.Items.map((item: any) => ({
      name: item.team_name.S,
      rating: item.current_rating.N,
    }));
  }

  return {
    props: { teams }, // will be passed to the page component as props
  };
};

export default Scrimmages;
