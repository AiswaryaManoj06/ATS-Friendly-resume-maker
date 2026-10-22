import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator for 6-digit postal pincode.
 * Must be exactly 6 numeric digits (e.g. 560001, 682001).
 */
export function pincodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value && value !== 0) {
      // Empty values are handled by Validators.required
      return null;
    }

    const stringVal = String(value).trim();
    const isValid = /^\d{6}$/.test(stringVal);

    if (!isValid) {
      return {
        invalidPincode: {
          actual: stringVal,
          message: 'Pincode must be exactly 6 digits (0-9)',
        },
      };
    }

    return null;
  };
}
