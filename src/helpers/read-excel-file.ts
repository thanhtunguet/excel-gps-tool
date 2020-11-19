export function readExcelFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader: FileReader = new FileReader();

    reader.onload = function () {
      resolve(this.result as string);
    };

    reader.onerror = function (error: ProgressEvent<FileReader>) {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
}
