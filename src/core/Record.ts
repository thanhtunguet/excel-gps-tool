import {CellObject} from 'xlsx/types';

export interface Record {
  no: string;

  address: CellObject;

  latitude: CellObject;

  longitude: CellObject;
}
