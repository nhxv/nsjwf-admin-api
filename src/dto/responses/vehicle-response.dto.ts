export class VehicleResponseDto {
  constructor(
    public licensePlate: string,
    public available: boolean,
    public discontinued: boolean,
    public id?: number,
    public nickname?: string,
    public volume?: number,
  ) {}
}