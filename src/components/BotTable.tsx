import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { TeamBot } from '@pages/api/admin/admin-bot-history';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const DownloadCell = (cell: { row: { original: { bot: any } } }) => {
  const { row } = cell;
  const url = row.original.bot;
  if (url === 'unknown') {
    return <div>N/A</div>;
  }
  return <a href={url}>Download</a>;
};

const BotTable = (props: { data: TeamBot[] }) => {
  const { data } = props;
  const columns = useMemo<MRT_ColumnDef<TeamBot>[]>(
    () => [
      {
        accessorKey: 'team',
        header: 'Team',
        filterVariant: 'autocomplete',
        size: 400,
      },
      {
        accessorFn: (originalRow) => new Date(originalRow.upload_time), // convert to date for sorting and filtering
        id: 'upload_time',
        header: 'Upload Time',
        filterVariant: 'datetime-range',
        Cell: ({ cell }) => cell.getValue<Date>().toLocaleString('en-US'), // convert back to string for display
        size: 500,
      },
      {
        accessorFn: (originalRow) => originalRow.upload_name,
        header: 'Bot',
        Cell: DownloadCell,
        filterVariant: 'select',
        grow: true,
        size: 180,
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

const BotTableWithLocalizationProvider = (props: { data: TeamBot[] }) => {
  const { data } = props;
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BotTable data={data} />
    </LocalizationProvider>
  );
};

export default BotTableWithLocalizationProvider;
