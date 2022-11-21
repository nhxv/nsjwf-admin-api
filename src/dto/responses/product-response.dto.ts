export class ProductResponseDto {
  constructor(
    public name: string,
    public discontinued: boolean,
    public id?: number,
  ) {}
}