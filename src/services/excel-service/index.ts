import {Service} from 'react3l-common';
import {useTemplate} from 'services/excel-service/use-template';
import {useFile} from 'services/excel-service/use-file';

export class ExcelService extends Service {
  constructor() {
    super();
  }

  public readonly useTemplate = useTemplate;

  public readonly useFile = useFile;
}

export const excelService = new ExcelService();
