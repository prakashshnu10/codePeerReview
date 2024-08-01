import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?!.*\s)/, {
    message: 'Old password must not contain spaces',
  })
  readonly oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'New Password must be at least 8 characters long' })
  @Matches(/^(?!.*\s)/, {
    message: 'New password must not contain spaces',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  readonly newPassword: string;

  @IsNotEmpty()
  @IsString()
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
}
