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
        header: 'ID',
        filterVariant: 'autocomplete',
        size: 80,
      },
      {
        accessorKey: 'player1',
        header: 'Team 1',
        filterVariant: 'autocomplete',
        size: 200,
        maxSize: 140,
      },
      {
        accessorKey: 'player2',
        header: 'Team 2',
        filterVariant: 'autocomplete',
        size: 200,
        maxSize: 140,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        filterVariant: 'select',
        size: 150,
      },
      {
        accessorKey: 'map',
        header: 'Map',
        filterVariant: 'multi-select',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterVariant: 'select',
        size: 130,
      },
      {
        accessorKey: 'outcome',
        header: 'Winner',
        filterVariant: 'select',
        size: 140,
      },
      {
        accessorKey: 'replay',
        header: 'Replay',
        Cell: ReplayCell,
        filterVariant: 'select',
        size: 130,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: data == null ? [] : data,
    enableFacetedValues: true,
    enableColumnResizing: true,
    enableFullScreenToggle: false,
    initialState: { showColumnFilters: true },
  });

  return <MaterialReactTable table={table} />;
};

export default MatchTable;
