import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Match } from '@pages/api/admin/admin-match-history';

const ReplayCell = ({ cell }: { cell: any }) => (
  <a href={cell.getValue()}>Download</a>
);

const MatchTable = (props: { data: Match[] }) => {
  const { data } = props;
  const columns = useMemo<MRT_ColumnDef<Match>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Match ID',
        filterVariant: 'autocomplete',
        size: 150,
      },
      {
        accessorKey: 'player1',
        header: 'Team 1',
        filterVariant: 'autocomplete',
        size: 200,
        maxSize: 250,
      },
      {
        accessorKey: 'player2',
        header: 'Team 2',
        filterVariant: 'autocomplete',
        size: 200,
        maxSize: 250,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        filterVariant: 'select',
        size: 180,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterVariant: 'select',
        size: 180,
      },
      {
        accessorKey: 'outcome',
        header: 'Winning Team',
        filterVariant: 'select',
        size: 180,
      },
      {
        accessorKey: 'replay',
        header: 'Replay',
        Cell: ReplayCell,
        filterVariant: 'multi-select',
        size: 180,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    enableFacetedValues: true,
    enableColumnResizing: true,
    enableFullScreenToggle: false,
    initialState: { showColumnFilters: true },
  });

  return <MaterialReactTable table={table} />;
};

export default MatchTable;
