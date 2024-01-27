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
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';

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

interface ConfigData {
  disabled_bracket_switching: boolean;
  disabled_team_modifications: boolean;
  disabled_scrimmage_requests: boolean;
  disabled_code_submissions: boolean;
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
      {match.status === 'COMPLETE' ? (
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
const TeamInfo: React.FC<{
  oppTeam: Team;
  playerTeam: string;
  disabledScrimmageRequests: boolean;
}> = ({ oppTeam, playerTeam, disabledScrimmageRequests }) => {
  const requestMatch = async () => {
    if (disabledScrimmageRequests) {
      toast.error('Scrimmage requests are currently disabled.');
      return;
    }

    axios
      .post('/api/user/match-request', {
        player: playerTeam,
        opp: oppTeam.name,
      })
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          toast.success('Match Request Sent!');
        }
      })
      .catch((reason: AxiosError) => {
        if (reason.response?.status === 500) {
          toast.error('Internal Error, please try again later');
        } else if (reason.response?.status === 412) {
          toast.error('You have already requested a match with this team');
        } else if (reason.response?.status === 400) {
          toast.error('Either you or your opponent have not uploaded a bot');
        } else {
          toast.error('Something went wrong');
        }
      });
  };

  return (
    <Card className='mb-3'>
      <Card.Body>
        <Card.Title>{oppTeam.name}</Card.Title>
        <Card.Subtitle className='mb-2 text-muted' />
        <Card.Text>Rating: {oppTeam.rating}</Card.Text>
        <Button variant='dark' onClick={requestMatch}>
          Request Match
        </Button>
      </Card.Body>
    </Card>
  );
};

const ScrimmageRequestDropdown: React.FC<{
  teams: Team[];
  userteam: string;
  setCurrentTeamSearch: React.Dispatch<React.SetStateAction<Team | null>>;
}> = ({ teams, userteam, setCurrentTeamSearch }) => {
  const [TeamValue, setValue] = useState<string | null>(null);

  const teamnames = teams.map((team: Team) => team.name);
  const index = teamnames.indexOf(userteam);
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
        id='teams_dropdown'
        options={teamnames}
        sx={{ width: 800 }}
        renderInput={(params) => <TextField {...params} label='Teams' />}
      />
      <Button
        variant='dark'
        style={{ marginLeft: 10 }}
        onClick={onSearch}
        size='lg'
      >
        Search
      </Button>
    </div>
  );
};

const ScrimmagesTable: React.FC<{ data: Match[] }> = ({ data }) => (
  <Table striped bordered hover className='text-center'>
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
  userTeam,
  teams,
  configData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession({ required: true });
  const [CurrentTeamSearch, setCurrentTeamSearch] = useState<Team | null>(null);

  const { disabled_scrimmage_requests: disabledScrimmageRequests } = configData;

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
      <Card className='mb-3'>
        <Card.Body>
          <Card.Title>Available Scrimmages</Card.Title>
          <ScrimmageRequestDropdown
            teams={teams}
            userteam={userTeam}
            setCurrentTeamSearch={setCurrentTeamSearch}
          />
        </Card.Body>
      </Card>
      {CurrentTeamSearch && (
        <TeamInfo
          oppTeam={CurrentTeamSearch}
          playerTeam={userTeam}
          disabledScrimmageRequests={disabledScrimmageRequests}
        />
      )}
      <Card>
        <Card.Body>
          <Card.Title>Scrimmage History</Card.Title>
          <Button
            variant='dark'
            className='mb-3'
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

  const userInfo = await client.send(
    new GetCommand({
      TableName: process.env.AWS_TABLE_NAME,
      Key: {
        pk: `user:${session.user.name}`,
        sk: `user:${session.user.name}`,
      },
      ProjectionExpression: '#team',
      ExpressionAttributeNames: {
        '#team': 'team',
      },
    }),
  );

  if (!userInfo || !userInfo.Item || !userInfo.Item.team) {
    return {
      redirect: {
        destination: '/team',
        permanent: false,
      },
    };
  }

  const { team } = userInfo.Item;

  // query player table for team names
  const teamQueryParams: QueryCommandInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: process.env.AWS_RECORD_INDEX,
    KeyConditionExpression: 'record_type = :record',
    ExpressionAttributeValues: {
      ':record': { S: 'team' },
    },
    ProjectionExpression: '#teamName, #rating',
    ExpressionAttributeNames: {
      '#teamName': 'name',
      '#rating': 'num',
    },
  };

  const command = new QueryCommand(teamQueryParams);
  const result = await client.send(command);
  const defaultRating = process.env.DEFAULT_RATING || 0;

  let teams: Team[] = [];
  if (result.Items) {
    teams = result.Items.filter((item: any) => item.name).map((item: any) => ({
      name: item.name.S,
      rating: item.num ? item.num.N : (defaultRating as number),
    }));
  }

  return {
    props: {
      userTeam: team,
      teams,
      configData: configs,
    }, // will be passed to the page component as props
  };
};

export default Scrimmages;
