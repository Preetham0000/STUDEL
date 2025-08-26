
import { OrderStatus, Role } from './types';

export const APP_NAME = 'Studel';

export const ROLES: Role[] = [Role.CUSTOMER, Role.RUNNER, Role.CANTEEN, Role.ADMIN];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.ARRIVING,
  OrderStatus.DELIVERED,
];

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PLACED:
      return 'bg-blue-100 text-blue-800';
    case OrderStatus.ACCEPTED:
    case OrderStatus.PREPARING:
      return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.READY_FOR_PICKUP:
      return 'bg-indigo-100 text-indigo-800';
    case OrderStatus.PICKED_UP:
    case OrderStatus.ARRIVING:
      return 'bg-purple-100 text-purple-800';
    case OrderStatus.DELIVERED:
      return 'bg-green-100 text-green-800';
    case OrderStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
