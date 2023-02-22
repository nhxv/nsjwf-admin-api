export interface CustomerProductTendencyRequestDto {
  customerName: string;
  productName: string;
  quantity: number;
  unitCode: string;
  id?: number;
}
