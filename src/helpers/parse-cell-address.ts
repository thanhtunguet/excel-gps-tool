export interface CellAddr {
  col: string;

  row: string;
}

export function parseCellAddress(addr: string): CellAddr {
  const [col, row] = addr.replace(/^([A-Z]+)([0-9]+)$/, '$1-$2').split('-', 2);
  return {
    col,
    row,
  };
}
