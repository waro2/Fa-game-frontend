import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
    passwordField: string,
    confirmPasswordField: string
): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const password = control.get(passwordField)?.value;
        const confirmPassword = control.get(confirmPasswordField)?.value;

        if (!password || !confirmPassword) {
            return null;
        }

        if (password !== confirmPassword) {
            return { passwordMismatch: true };
        }

        return null;
    };
}