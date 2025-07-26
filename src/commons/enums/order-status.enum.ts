export enum OrderStatus {
  PICKING = "PICKING",
  CHECKING = "CHECKING",
  SHIPPING = "SHIPPING",
  DELIVERED = "DELIVERED",
  CANCELED = "CANCELED",
  COMPLETED = "COMPLETED",
}

export function toOrderStatus(s: string): OrderStatus | null {
  switch (s) {
    case "PICKING":
      return OrderStatus.PICKING;
    case "CHECKING":
      return OrderStatus.CHECKING;
    case "SHIPPING":
      return OrderStatus.SHIPPING;
    case "DELIVERED":
      return OrderStatus.DELIVERED;
    case "CANCELED":
      return OrderStatus.CANCELED;
    case "COMPLETED":
      return OrderStatus.COMPLETED;
    default:
      return null;
  }
}
