export interface VehicleResponseDto {
  licensePlate: string,
  available: boolean,
  discontinued: boolean,
  id?: number,
  nickname?: string,
  volume?: number,
}