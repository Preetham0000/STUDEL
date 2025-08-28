export enum Role {
  CUSTOMER = 'Customer',
  RUNNER = 'Runner',
  CANTEEN = 'Canteen',
  ADMIN = 'Admin',
}

export enum OrderStatus {
  PLACED = 'Placed',
  ACCEPTED = 'Accepted',
  PREPARING = 'Preparing',
  READY_FOR_PICKUP = 'Ready for Pickup',
  PICKED_UP = 'Picked Up',
  ARRIVING = 'Arriving',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  campusId?: string;
  isApproved?: boolean;
  vendorId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  vendorId: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  runnerId?: string;
  runnerName?: string;
  vendorId: string;
  items: CartItem[];
  totalPrice: number;
  deliveryFee: number;
  finalAmount: number;
  deliveryZone: DeliveryZone;
  status: OrderStatus;
  paymentCollected: boolean;
  createdAt: number;
  statusHistory: { status: OrderStatus; timestamp: number }[];
}

export interface Vendor {
    id: string;
    name: string;
    operatingHours: string;
    image: string;
}