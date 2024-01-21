import { UserLayout } from '@layout';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { Card } from 'react-bootstrap';
import { useRouter } from 'next/router'
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

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

const Team: NextPage = ({
    submissionData,
  }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

    const router = useRouter();
    const { teamId } = router.query;


    return (
        <UserLayout>
            <Card className="mb-3">
            <Card.Body>
                <Card.Title>Getting Started</Card.Title>
                <Card.Text>
                Follow through the instructions below to learn more about installation
                instructions, how you can upload your bot submissions, request
                scrimmages with other players, and check out your match results!
                </Card.Text>
            </Card.Body>
            </Card>
            <Card className="mb-3">
            <Card.Body>
                <Card.Title>Upload Bots</Card.Title>
                <Card.Text>
                Navigate to the submissions page to upload your bot files and view
                your previous submissions. You may upload submissions at any time and
                your current file will be used as your submission for any scrimmages
                you may request or matches we run.
                </Card.Text>
            </Card.Body>
            </Card>
            <Card className="mb-3">
            <Card.Body>
                <Card.Title>Scrimmages</Card.Title>
                <Card.Text>
                Find the scrimmages page to request unranked matches with any teams
                listed in the dropdown. You may request up to 5 scrimmages per hour.
                These scrimmages do not affect your rating on the leaderboard.
                </Card.Text>
            </Card.Body>
            </Card>
            <Card>
            <Card.Body>
                <Card.Title>Leaderboard</Card.Title>
                <Card.Text>
                Check out the leaderboard to see how your rating is against other
                teams participating in AWAP.{' '}
                </Card.Text>
            </Card.Body>
            </Card>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { teamname } = context.params;

    console.log(teamname);

    // check if the teamname exists in DB
    // if it does not, redirect to /team page
    // if it does, check if the user is in the team
    // if the user is not in the team, pass in authenticated = false props
    // if the user is in the team, pass in authenticated = true props

    // Use getItem to check if the team exists

    const getParams : GetCommandInput = {
        TableName: process.env.AWS_TABLE_NAME,
        Key: {
          pk: "team:" + teamname,
          sk: "team:" + teamname,
        },
      };
    
      const command = new GetCommand(getParams);
      const result = await client.send(command);
    
      const teamData = result.Item;
      console.log(teamData);
    
      if (!teamData) {
        return {
          redirect: {
            destination: '/team',
            permanent: false,
          },
        };
      }


    return {
        props: { authenticated: true },
    };
  }

export default Team;
