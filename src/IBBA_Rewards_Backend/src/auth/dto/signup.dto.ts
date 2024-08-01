import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z]+$/, { message: 'First Name must contain only letters.' })
  @Matches(/^[^ ].*$/, { message: 'First Name must not start with a space.' })
  @MinLength(3, { message: 'First Name must be at least 3 characters long' })
  readonly first_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z]+$/, { message: 'Last Name must contain only letters.' })
  @Matches(/^[^ ].*$/, { message: 'Last Name must not start with a space.' })
  @MinLength(1, { message: 'Last Name must be at least 1 characters long' })
  readonly last_name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?!.*\s)/, {
    message: 'Password must not contain spaces',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  readonly password: string;

  @IsNotEmpty()
  readonly referral_code: string;

  @IsNotEmpty()
  @Matches(/^(?!.*\s)/, {
    message: 'Confirm Password must not contain spaces',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Confirm Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  readonly confirmPassword: string;

  readonly referred_by_user_id: string;

  readonly created_by: string;

  readonly updated_by: string;

  readonly level: string;

  readonly user_wallet: string;

  readonly otp: string;
}
