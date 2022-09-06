import {ExcelService} from 'services/excel-service/index';
import React from 'react';
import XLSX, {Sheet, WorkBook} from 'xlsx';

export function useTemplate(this: ExcelService): [() => void] {
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

  return [handleDownloadTemplate];
}
