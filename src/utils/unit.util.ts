import { createUnitCode } from "./code.util";
import { CreateUnitReq } from "../modules/inventory/inventory.dto";

export const createUnits = (
  itemId: string,
  itemCode: string,
  length: number,
) => {
  const units: CreateUnitReq[] = [];
  for (let i = 1; i <= length; i++) {
    units.push({ code: createUnitCode(itemCode, i), itemId });
  }
  return units;
};
