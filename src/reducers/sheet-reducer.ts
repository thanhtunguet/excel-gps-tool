import {Record} from 'core/Record';

export function sheetReducer(state: Record[], action: SheetAction): Record[] {
  switch (action.type) {
    case SheetBehavior.replace:
      return action.list;

    case SheetBehavior.patchIndex:
      state[action.index] = action.record;
      return [...state];

    default:
      return state;
  }
}

export interface SheetAction {
  type: SheetBehavior;
  list?: Record[];
  index?: number;
  record?: Record;
}

export enum SheetBehavior {
  replace,
  patchIndex,
}
