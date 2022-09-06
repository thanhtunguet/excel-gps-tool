import {CellObject} from 'xlsx';

export const columns = [
  {
    title: 'Column',
    dataIndex: 'no',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    render(cell: CellObject) {
      return cell?.v;
    },
  },
  {
    title: 'Latitude',
    dataIndex: 'latitude',
    render(cell: CellObject) {
      return cell?.v;
    },
  },
  {
    title: 'Longitude',
    dataIndex: 'longitude',
    render(cell: CellObject) {
      return cell?.v;
    },
  },
];
