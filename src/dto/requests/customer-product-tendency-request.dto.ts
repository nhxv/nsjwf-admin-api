export class CustomerProductTendencyRequestDto {
  constructor (
    public customerName: string,
    public productName: string,
    public quantity: number,
    public id?: number,
  ) {}
}