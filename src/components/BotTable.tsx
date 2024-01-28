import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { TeamBot } from '@pages/api/admin/admin-bot-history';

const DownloadCell = (cell: { row: { original: { bot: any } } }) => {
  const url = cell.row.original.bot;
  if (url === 'unknown') {
    return <div>N/A</div>;
  } else {
    return <a href={url}>Download</a>;
  }
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
        accessorFn: (originalRow) => new Date(originalRow.upload_time), //convert to date for sorting and filtering
        id: 'upload_time',
        header: 'Upload Time',
        filterVariant: 'datetime-range',
        filterFn: 'between',
        Cell: ({ cell }) => cell.getValue<Date>().toLocaleString(), // convert back to string for display
        size: 500,
      },
      {
        // accessorKey: 'bot',
        accessorFn: (originalRow) => originalRow.upload_name,
        header: 'Bot',
        Cell: DownloadCell,
        filterVariant: 'select',
        filterFn: (row, id, filterValue) =>
          row.original.upload_name === filterValue,
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

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const BotTableWithLocalizationProvider = (props: { data: TeamBot[] }) => {
  const { data } = props;
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BotTable data={data} />
    </LocalizationProvider>
  );
};

export default BotTableWithLocalizationProvider;
