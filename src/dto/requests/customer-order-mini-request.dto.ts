export class CustomerOrderMiniRequestDto {
  constructor(
    public customerName: string,
    public code: string,
    public id?: number,
  ) {}
}