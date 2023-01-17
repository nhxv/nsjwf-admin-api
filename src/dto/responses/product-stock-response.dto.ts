export class ProductStockResponseDto {
  constructor(
    public name: string,
    public quantity: number,
    public id?: number,
  ) {}
}