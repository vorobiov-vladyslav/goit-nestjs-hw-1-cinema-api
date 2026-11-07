import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@ValidatorConstraint({ name: 'isValidDateOnly', async: false })
export class IsValidDateOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid calendar date in YYYY-MM-DD format`;
  }
}

export function IsValidDateOnly(validationOptions?: ValidationOptions) {
  return Validate(IsValidDateOnlyConstraint, validationOptions);
}
