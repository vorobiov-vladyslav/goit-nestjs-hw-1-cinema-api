import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotInPast', async: false })
export class IsNotInPastConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return false;
    }

    return timestamp > Date.now();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid future ISO 8601 date-time`;
  }
}

export function IsNotInPast(validationOptions?: ValidationOptions) {
  return Validate(IsNotInPastConstraint, validationOptions);
}
