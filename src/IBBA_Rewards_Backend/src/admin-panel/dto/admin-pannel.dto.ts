import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: ' please enter a valid email address' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly otp: string;
}
