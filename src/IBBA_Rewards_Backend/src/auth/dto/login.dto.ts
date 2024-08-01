import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: ' please enter a valid email address' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
