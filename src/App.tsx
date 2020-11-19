import {DownloadOutlined, ExportOutlined} from '@ant-design/icons';
import {Client, GeocodeResponse} from '@googlemaps/google-maps-services-js';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Progress from 'antd/lib/progress';
import Table, {ColumnProps} from 'antd/lib/table';
import {Record} from 'core/Record';
import {parseCellAddress} from 'helpers/parse-cell-address';
import {readExcelFile} from 'helpers/read-excel-file';
import React, {Reducer} from 'react';
import {SheetAction, SheetBehavior, sheetReducer} from 'reducers/sheet-reducer';
import {Observable, Subscriber} from 'rxjs';
import {retry} from 'rxjs/operators';
import XLSX, {CellObject, Sheet, WorkBook} from 'xlsx';
import message from 'antd/lib/message';

const {Item: FormItem} = Form;

const layout = {
  labelCol: {span: 8},
  wrapperCol: {span: 8},
};

const tailLayout = {
  wrapperCol: {offset: 8, span: 16},
};

const client: Client = new Client();

const step: number = 5;

function App() {
  const [workbook, setWorkbook] = React.useState<WorkBook>(null);

  const [current, setCurrent] = React.useState<number>(0);

  const [apiKey, setApiKey] = React.useState<string>('');

  const [loading, setLoading] = React.useState<boolean>(false);

  const handleSetApiKey = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setApiKey(event.target.value);
    },
    [],
  );

  const handleCheckAPIKey = React.useCallback(() => {
    if (!apiKey) {
      message.error(
        'Missing API Key. You must have Google Maps API key to perform this action.',
      );
    }
    return !!apiKey;
  }, [apiKey]);

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
    async (record: Record, apiKey: string, index: number): Promise<Record> => {
      if (record.address?.v) {
        await new Observable((subscriber: Subscriber<Record>) => {
          client
            .geocode({
              params: {
                address: record.address?.h,
                key: apiKey,
              },
            })
            .then((response: GeocodeResponse) => {
              if (response.data.results?.length > 0) {
                const {lat, lng} = response.data.results[0].geometry.location;
                record.latitude = {
                  v: lat,
                  t: 'n',
                };
                record.longitude = {
                  v: lng,
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
        })
          .pipe(retry(3))
          .toPromise();
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
            return handleCell(record, apiKey, i + index);
          }),
        );
      } catch (error) {}
      setCurrent(i + Math.min(sliced.length, step) + i);
    }
    setLoading(false);
  }, [apiKey, entries, handleCell, handleCheckAPIKey]);

  const handleExport = React.useCallback(() => {
    if (!loading) {
      entries.forEach((record: Record) => {
        const {row} = parseCellAddress(record.no);
        workbook.Sheets.addresses[`C${row}`] = record.latitude;
        workbook.Sheets.addresses[`D${row}`] = record.longitude;
      });
      XLSX.writeFile(workbook, 'result.xlsx');
    }
  }, [workbook, loading, entries]);

  const handleDownloadTemplate = React.useCallback(() => {
    const workbook: WorkBook = XLSX.utils.book_new();
    const sheet: Sheet = XLSX.utils.json_to_sheet([
      {
        no: '',
        address: '',
        latitude: '',
        longitude: '',
      },
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'addresses');
    XLSX.writeFile(workbook, 'template.xlsx');
  }, []);

  const columns: Array<ColumnProps<Record>> = React.useMemo(() => {
    return [
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
  }, []);

  return (
    <Card title="GMaps Coordinate Filler" className="p-1">
      <Form {...layout}>
        <FormItem label="API Key">
          <Input
            className="my-1"
            type="text"
            value={apiKey}
            onChange={handleSetApiKey}
            placeholder="API Key"
          />
        </FormItem>
        <FormItem label="Data file">
          <Input className="my-1" type="file" onChange={handleSelectFile} />
        </FormItem>
        <FormItem {...tailLayout}>
          <Button
            className="my-1 mr-2"
            type="primary"
            onClick={handleParse}
            loading={loading}>
            Proceed
          </Button>
          <Button
            className="my-1 mr-2"
            type="default"
            onClick={handleDownloadTemplate}
            disabled={loading}>
            <div className="d-flex align-items-center">
              Template
              <DownloadOutlined className="ml-2" />
            </div>
          </Button>
          <Button type="primary" onClick={handleExport} disabled={loading}>
            <div className="d-flex align-items-center">
              Export
              <ExportOutlined className="ml-2" />
            </div>
          </Button>
        </FormItem>
      </Form>
      {loading && entries?.length > 0 && (
        <Progress
          className="my-1"
          percent={Math.round((current * 100) / entries.length)}
          status="active"
        />
      )}
      <Table
        className="my-1"
        dataSource={entries}
        rowKey="no"
        columns={columns}
        pagination={{pageSize: entries?.length ?? 10}}
      />
    </Card>
  );
}

export default App;
