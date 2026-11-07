import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueSeats', async: false })
export class IsUniqueSeatsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    const seen = new Set<string>();

    for (const item of value) {
      if (item === null || typeof item !== 'object') {
        continue;
      }

      const { row, seat } = item as { row?: unknown; seat?: unknown };
      if (typeof row !== 'number' || typeof seat !== 'number') {
        continue;
      }

      const key = `${row}:${seat}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'seats must not contain the same row/seat pair more than once';
  }
}

export function IsUniqueSeats(validationOptions?: ValidationOptions) {
  return Validate(IsUniqueSeatsConstraint, validationOptions);
}
