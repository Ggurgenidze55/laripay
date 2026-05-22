import { Decimal } from '@prisma/client/runtime/library';
export declare function decimalToNumber(value: Decimal | null | undefined): number;
export declare function toDecimal(value: number | string): Decimal;
