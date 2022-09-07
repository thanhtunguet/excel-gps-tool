import 'reflect-metadata';
import {DownloadOutlined, ExportOutlined} from '@ant-design/icons';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Progress from 'antd/lib/progress';
import Table from 'antd/lib/table';
import React from 'react';
import {layout, tailLayout} from 'config/form';
import {columns} from 'config/columns';
import {excelService} from 'services/excel-service';

const {Item: FormItem} = Form;

function App() {
  const [
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
  ] = excelService.useFile();

  const [handleDownloadTemplate] = excelService.useTemplate();

  return (
    <Card title="Excel GPS Tool" className="p-1">
      <Form {...layout}>
        <FormItem label="APP_ID">
          <Input
            className="my-1"
            type="text"
            value={appId}
            onChange={handleSetAppId}
            placeholder="APP_ID"
          />
        </FormItem>
        <FormItem label="APP_CODE">
          <Input
            className="my-1"
            type="text"
            value={appCode}
            onChange={handleSetAppCode}
            placeholder="APP_CODE"
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
        loading={loading}
        className="my-2"
        dataSource={entries}
        rowKey="no"
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
      />
    </Card>
  );
}

export default App;
