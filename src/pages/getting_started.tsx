import { UserLayout } from "@layout";
import { NextPage } from "next";
import { Card } from "react-bootstrap";

const GettingStarted: NextPage = () => (
  <UserLayout>
    <Card.Title>Getting Started</Card.Title>
    <Card.Text>
      Follow the instructions below to install the Martian environment, upload
      your algorithm submissions, request scrimmages with other players, and
      check out your match results - happy hacking!
    </Card.Text>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Installation</Card.Title>
        <Card.Text>
          Visit our AWAP 2023{" "}
          <a href="https://github.com/ACM-CMU/awap-viewer-2023">Viewer</a> and{" "}
          <a href="https://github.com/ACM-CMU/awap-engine-2023">Engine</a>{" "}
          GitHub repos to install the Martian environment. You'll need Python
          and Node.js, and will use this Dashboard, Viewer, and Engine to
          compete and iterate on your algorithms.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Upload Bots</Card.Title>
        <Card.Text>
          Navigate to the Submissions page to upload your bot files and view
          your previous submissions. You may upload submissions at any time and
          your current file will be used as your submission for any scrimmages
          or tournament matches.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>Scrimmages</Card.Title>
        <Card.Text>
          Navigate to the Scrimmages page to request unranked matches with any
          teams listed in the dropdown. You may request up to 5 scrimmages per
          hour. These scrimmages do not affect your rating on the leaderboard.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card>
      <Card.Body>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Text>
          Navigate to the leaderboard to see your rating compared to competing
          teams participating in AWAP.{" "}
        </Card.Text>
      </Card.Body>
    </Card>
  </UserLayout>
);

export default GettingStarted;
