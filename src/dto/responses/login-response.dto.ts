export class LoginResponseDto {
  constructor(
    public username: string,
    public roleId: number,
    public token: string,
  ) {}

}