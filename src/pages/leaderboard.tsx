import { GetServerSideProps, NextPage } from 'next';
import { UserLayout } from '@layout';
import { Card, Table, Form } from 'react-bootstrap';
import { Leaderboard } from '@models/leaderboard';
import { ResourceList } from '@models/resource-list';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSort,
  faSortDown,
  faSortUp,
} from '@fortawesome/free-solid-svg-icons';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { useRouter } from 'next/router';
import {
  DynamoDB,
  DynamoDBClientConfig,
  QueryCommand,
  QueryInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

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

const rankColorMap: Record<number, string> = {
  1: '#fec',
  2: '#eee',
  3: '#fc8',
  4: '#fff',
};

type RankLabelProps = {
  rank: number;
};

const RankLabel = ({ rank }: RankLabelProps) => (
  <td
    className='text-black d-table-cell text-uppercase text-center me-2'
    style={{
      backgroundColor: rankColorMap[rank],
      fontSize: '.96rem',
      width: '100px',
    }}
  >
    {rank}
  </td>
);

type THSortProps = {
  name: string;
} & PropsWithChildren;

const THSort = (props: THSortProps) => {
  const { name, children } = props;
  const [icon, setIcon] = useState(faSort);
  const router = useRouter();
  const {
    query: { sort, order },
  } = router;

  const onClick = () => {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        sort: name,
        order: order === 'asc' ? 'desc' : 'asc',
      },
    });
  };

  useEffect(() => {
    if (sort !== name) {
      setIcon(faSort);
      return;
    }

    if (order === 'asc') {
      setIcon(faSortUp);
      return;
    }

    if (order === 'desc') {
      setIcon(faSortDown);
    }
  }, [sort, order, name]);

  return (
    <a
      className='text-decoration-none'
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onClick}
    >
      {children}
      <FontAwesomeIcon icon={icon} fixedWidth size='xs' />
    </a>
  );
};

type PaginationProps = {
  meta: ResourceList<Leaderboard>['meta'];
};

const Pagination = (props: PaginationProps) => {
  const {
    meta: {
      from,
      to,
      total,
      per_page: perPage,
      last_page: lastPage,
      current_page: currentPage,
    },
  } = props;

  const [pageIndex, setPageIndex] = useState(currentPage - 1);
  const router = useRouter();

  useEffect(() => {
    setPageIndex(currentPage - 1);
  }, [currentPage]);

  return (
    <div className='row align-items-center justify-content-center'>
      <div className='col-12 text-center text-sm-start col-sm-auto col-lg mb-3'>
        Showing <span className='fw-semibold'>{from}</span> to{' '}
        <span className='fw-semibold'>{Math.min(to, total)}</span> of{' '}
        <span className='fw-semibold'>{total}</span> results
      </div>
      <div className='col-auto ms-sm-auto mb-3'>
        Rows per page:{' '}
        <Form.Select
          value={perPage}
          className='d-inline-block w-auto'
          aria-label='Item per page'
          onChange={(event) => {
            router.push({
              pathname: router.pathname,
              query: {
                ...router.query,
                page: 1, // Go back to first page
                per_page: event.target.value,
              },
            });
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </Form.Select>
      </div>
      <div className='col-auto ms-sm-auto mb-3 overflow-auto'>
        <ReactPaginate
          forcePage={pageIndex}
          pageCount={lastPage}
          marginPagesDisplayed={1}
          pageRangeDisplayed={3}
          containerClassName='pagination mb-0'
          previousClassName='page-item'
          pageClassName='page-item'
          breakClassName='page-item'
          nextClassName='page-item'
          previousLinkClassName='page-link'
          pageLinkClassName='page-link'
          breakLinkClassName='page-link'
          nextLinkClassName='page-link'
          previousLabel='‹'
          nextLabel='›'
          activeClassName='active'
          disabledClassName='disabled'
          onPageChange={(selectedItem) => {
            router.push({
              pathname: router.pathname,
              query: {
                ...router.query,
                page: selectedItem.selected + 1,
              },
            });
          }}
        />
      </div>
    </div>
  );
};

type Props = {
  teamResourceList: ResourceList<Leaderboard>;
};

const Teams: NextPage<Props> = (props) => {
  const {
    teamResourceList: { data: teams, meta },
  } = props;

  return (
    <UserLayout>
      <Card>
        <Card.Header>Leaderboard</Card.Header>
        <Card.Body>
          <Pagination meta={meta} />
          <Table responsive bordered hover>
            <thead className='bg-light'>
              <tr>
                <th>
                  <THSort name='ranking'>Ranking</THSort>
                </th>
                <th>
                  <THSort name='tname'>Team name</THSort>
                </th>
                <th>
                  <THSort name='bracket'>Bracket</THSort>
                </th>
                <th className='text-end'>
                  <THSort name='rating'>Rating</THSort>
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.tname}>
                  <RankLabel key={team.tname} rank={team.ranking} />
                  <td>{team.tname}</td>
                  <td>
                    {team.bracket.charAt(0).toUpperCase() +
                      team.bracket.slice(1)}
                  </td>
                  <td className='text-end'>{team.rating}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination meta={meta} />
        </Card.Body>
      </Card>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  let page = 1;
  if (context.query?.page && typeof context.query.page === 'string') {
    page = parseInt(context.query.page, 10);
  }

  let perPage = 10;
  if (context.query?.per_page && typeof context.query.per_page === 'string') {
    perPage = parseInt(context.query.per_page.toString(), 10);
  }

  let sort = 'ranking';
  if (context.query?.sort && typeof context.query.sort === 'string') {
    sort = context.query.sort;
  }

  let order = 'asc';
  if (context.query?.order && typeof context.query.order === 'string') {
    order = context.query.order;
  }

  const params: QueryInput = {
    TableName: process.env.AWS_TABLE_NAME,
    IndexName: process.env.AWS_GSI_TYPENUM_INDEX,
    KeyConditionExpression: 'record_type = :record',
    ExpressionAttributeValues: {
      ':record': { S: 'team' },
    },
    ProjectionExpression: '#teamName, #rating, #bracket',
    ExpressionAttributeNames: {
      '#teamName': 'name',
      '#rating': 'num',
      '#bracket': 'bracket',
    },
    ScanIndexForward: false,
  };

  const command = new QueryCommand(params);
  const teamdata = await client.send(command);

  if (teamdata.Items === undefined) {
    return {
      props: {
        teamResourceList: {
          data: [],
          meta: {
            current_page: 1,
            per_page: 10,
            total: 0,
            from: 1,
            to: 1,
            last_page: 1,
          },
        },
      },
    };
  }

  const defaultRating = process.env.DEFAULT_RATING || '0';

  const items = teamdata.Items.sort((i1, i2) => {
    const i2Rating = parseInt(
      i2.num && i2.num.N ? i2.num.N : defaultRating,
      10,
    );
    const i1Rating = parseInt(
      i2.num && i2.num.N ? i2.num.N : defaultRating,
      10,
    );
    return i2Rating - i1Rating;
  });

  const teams: Leaderboard[] = items
    .filter((item: any) => item.name)
    .map((item, idx) => ({
      ranking: idx + 1,
      tname: item.name.S as string,
      rating: parseInt(item.num && item.num.N ? item.num.N : defaultRating, 10),
      bracket: (item.bracket ? item.bracket.S : 'beginner') as string,
    }));

  function sortmap(t: Leaderboard, att: string) {
    if (att === 'tname') return t.tname;
    if (att === 'rating') return t.rating;
    if (att === 'bracket') return t.bracket;
    return t.ranking;
  }

  const sorted = teams.sort((t1, t2) => {
    if (order === 'asc') {
      if (sortmap(t1, sort) < sortmap(t2, sort)) return -1;
      return 1;
    }
    if (sortmap(t1, sort) > sortmap(t2, sort)) return -1;
    return 1;
  });

  const total = sorted.length;
  const start = (page - 1) * perPage;
  const teamResourceList: ResourceList<Leaderboard> = {
    data: sorted.slice(start, Math.min(start + perPage, total)),
    meta: {
      current_page: page,
      last_page: Math.ceil(total / perPage),
      from: page === 1 ? 1 : (page - 1) * perPage + 1,
      to: page === 1 ? perPage : (page - 1) * perPage + perPage,
      per_page: perPage,
      total,
    },
  };

  return {
    props: {
      teamResourceList,
    }, // will be passed to the page component as props
  };
};

export default Teams;
