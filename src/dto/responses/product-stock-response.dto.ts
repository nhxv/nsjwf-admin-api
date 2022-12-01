export class ProductStockResponseDto {
  constructor(
    public productName: string,
    public quantity: number,
    public id?: number,
  ) {}
}