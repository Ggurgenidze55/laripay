import { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | null | undefined): number {
  if (value == null) return 0;
  return Number(value.toString());
}

export function toDecimal(value: number | string): Decimal {
  return new Decimal(value);
}
