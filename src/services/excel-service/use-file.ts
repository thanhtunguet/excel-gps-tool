import React, {Reducer} from 'react';
import XLSX, {Sheet, WorkBook} from 'xlsx';
import message from 'antd/lib/message';
import {Record} from 'core/Record';
import {SheetAction, SheetBehavior, sheetReducer} from 'reducers/sheet-reducer';
import {readExcelFile} from 'helpers/read-excel-file';
import {parseCellAddress} from 'helpers/parse-cell-address';
import {lastValueFrom, Observable, Subscriber} from 'rxjs';
import {Geocoder, HereProvider} from '@goparrot/geocoder';
import {retry} from 'rxjs/operators';
import {ExcelService} from 'services/excel-service/index';
import Axios, {AxiosInstance} from 'axios';
import QueryString from 'query-string';

const axios: AxiosInstance = Axios.create();

const step: number = 5;

export function useFile(
  this: ExcelService,
): [
  string,
  (event: React.ChangeEvent<HTMLInputElement>) => void,
  string,
  (event: React.ChangeEvent<HTMLInputElement>) => void,
  (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>,
  number,
  () => Promise<void>,
  () => void,
  Record[],
  boolean,
] {
  const [workbook, setWorkbook] = React.useState<WorkBook>(null);
  const [current, setCurrent] = React.useState<number>(0);

  const [appId, setAppId] = React.useState<string>('');
  const [appCode, setAppCode] = React.useState<string>('');

  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const queryString = QueryString.parse(location.search);
    if (Object.prototype.hasOwnProperty.call(queryString, 'appId')) {
      setAppId(queryString.appId as string);
    }
    if (Object.prototype.hasOwnProperty.call(queryString, 'appCode')) {
      setAppCode(queryString.appCode as string);
    }
  }, []);

  const handleSetAppId = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAppId(event.target.value);
    },
    [],
  );

  const handleSetAppCode = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAppCode(event.target.value);
    },
    [],
  );

  const handleCheckAPIKey = React.useCallback(() => {
    if (!appId || !appCode) {
      message.error(
        'Missing API Key. You must have Google Maps API key to perform this action.',
      );
      return false;
    }
    return true;
  }, [appId, appCode]);

  const [entries, dispatch] = React.useReducer<Reducer<Record[], SheetAction>>(
    sheetReducer,
    [],
  );

  const handleSelectFile = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!handleCheckAPIKey()) {
        return;
      }
      if (event.target.files?.length > 0) {
        const text: string = await readExcelFile(event.target.files[0]);
        const workbook: WorkBook = XLSX.read(text, {
          type: 'binary',
        });
        setWorkbook(workbook);
        const sheet: Sheet = workbook.Sheets.addresses;
        dispatch({
          type: SheetBehavior.replace,
          list: Object.entries(sheet)
            .filter(([key]) => key.startsWith('A') && key !== 'A1')
            .map(([key]) => {
              const {row} = parseCellAddress(key);
              return {
                no: key,
                address: sheet[`B${row}`],
                latitude: sheet[`C${row}`],
                longitude: sheet[`D${row}`],
              };
            }),
        });
      }
    },
    [handleCheckAPIKey],
  );

  const handleCell = React.useCallback(
    async (
      record: Record,
      appId: string,
      appCode: string,
      index: number,
    ): Promise<Record> => {
      if (record.address?.v) {
        await lastValueFrom(
          new Observable((subscriber: Subscriber<Record>) => {
            const provider: HereProvider = new HereProvider(
              axios,
              appId,
              appCode,
            );
            const geocoder: Geocoder = new Geocoder(provider);
            geocoder
              .geocode({
                address: record.address.h,
              })
              .then((locations) => {
                if (locations?.length > 0) {
                  const [{latitude, longitude}] = locations;
                  record.latitude = {
                    v: latitude,
                    t: 'n',
                  };
                  record.longitude = {
                    v: longitude,
                    t: 'n',
                  };
                  subscriber.next(record);
                }
              })
              .catch((error: Error) => {
                subscriber.error(error);
              })
              .finally(() => {
                subscriber.complete();
              });
          }).pipe(retry(3)),
        );

        dispatch({
          type: SheetBehavior.patchIndex,
          index,
          record,
        });
      }
      return record;
    },
    [],
  );

  const handleParse = React.useCallback(async () => {
    if (!handleCheckAPIKey()) {
      return;
    }
    setLoading(true);
    for (let i: number = 0; i < entries.length; i += step) {
      const sliced: Record[] = entries.slice(i, i + step);
      try {
        await Promise.all(
          sliced.map((record: Record, index: number) => {
            return handleCell(record, appId, appCode, i + index);
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      setCurrent(i + Math.min(sliced.length, step) + i);
    }
    setLoading(false);
  }, [appId, appCode, entries, handleCell, handleCheckAPIKey]);

  const handleExport = React.useCallback(() => {
    if (!loading) {
      if (workbook) {
        entries.forEach((record: Record) => {
          const {row} = parseCellAddress(record.no);
          workbook.Sheets.addresses[`C${row}`] = record.latitude;
          workbook.Sheets.addresses[`D${row}`] = record.longitude;
        });
        XLSX.writeFile(workbook, 'result.xlsx');
      }
    }
  }, [workbook, loading, entries]);

  return [
    appId,
    handleSetAppId,
    appCode,
    handleSetAppCode,
    handleSelectFile,
    current,
    handleParse,
    handleExport,
    entries,
    loading,
  ];
}
