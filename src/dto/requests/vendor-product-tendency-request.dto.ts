export class VendorProductTendencyRequestDto {
  constructor (
    public vendorName: string,
    public productName: string,
    public quantity: number,
    public id?: number,
  ) {}
}