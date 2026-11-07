import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

export interface SeatLike {
  row: number;
  seat: number;
}

export function isValidSeatEntry(value: unknown): value is SeatLike {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const { row, seat } = value as { row?: unknown; seat?: unknown };

  return (
    typeof row === 'number' &&
    Number.isInteger(row) &&
    row >= 1 &&
    typeof seat === 'number' &&
    Number.isInteger(seat) &&
    seat >= 1
  );
}

@ValidatorConstraint({ name: 'isSeatList', async: false })
export class IsSeatListConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every((item) => isValidSeatEntry(item));
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a non-empty array of objects with positive integer "row" and "seat"`;
  }
}

export function IsSeatList(validationOptions?: ValidationOptions) {
  return Validate(IsSeatListConstraint, validationOptions);
}
