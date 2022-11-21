export class CustomerResponseDto {
  constructor(
    public name: string,
    public discontinued: boolean,
    public id?: number,
    public address?: string,
    public phone?: string,
    public email?: string,
    public presentative?: string,
  ) {}
}