export class LoginResponseDto {
  constructor(
    public nickname: string,
    public roleId: number,
    public token: string,
  ) {}
}