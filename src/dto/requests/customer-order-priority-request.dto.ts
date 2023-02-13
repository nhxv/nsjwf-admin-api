import { CustomerOrderMiniRequestDto } from "./customer-order-mini-request.dto";

export interface CustomerOrderPriorityRequestDto {
  nickname: string;
  customerOrders: CustomerOrderMiniRequestDto[];
}
