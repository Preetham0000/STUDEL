import { db } from '../firebase';
import { User, Vendor, Product, DeliveryZone, Order, OrderStatus, Role, CartItem } from '../types';

const mapDocToData = <T,>(d: any): T => ({ ...d.data(), id: d.id } as T);

// --- Auth ---
// Note: This is a user lookup in the database, not true Firebase Authentication.
// A full implementation would use Firebase Auth SDK for sign-in.
export const apiLogin = async (phone: string): Promise<User | undefined> => {
  const usersRef = db.collection('users');
  const q = usersRef.where('phone', '==', phone).limit(1);
  const querySnapshot = await q.get();
  if (querySnapshot.empty) {
    return undefined;
  }
  return mapDocToData<User>(querySnapshot.docs[0]);
};

export const apiSignUp = async (name: string, phone: string, role: Role, campusId?: string): Promise<User> => {
  const existingUser = await apiLogin(phone);
  if (existingUser) {
    throw new Error("A user with this phone number already exists.");
  }

  const newUser = {
    name,
    phone,
    role,
    isApproved: role !== Role.RUNNER,
    campusId: role === Role.RUNNER ? campusId : undefined,
  };
  
  const docRef = await db.collection('users').add(newUser);
  return { ...newUser, id: docRef.id };
};


export const apiGetUserById = async (id: string): Promise<User | undefined> => {
    const docRef = db.collection('users').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return mapDocToData<User>(docSnap);
    }
    return undefined;
};


// --- Customer ---
export const apiFetchVendors = async (): Promise<Vendor[]> => {
    const querySnapshot = await db.collection('vendors').get();
    return querySnapshot.docs.map(d => mapDocToData<Vendor>(d));
};

export const apiFetchVendorById = async (id: string): Promise<Vendor | undefined> => {
    const docRef = db.collection('vendors').doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? mapDocToData<Vendor>(docSnap) : undefined;
};

export const apiFetchProductsByVendor = async (vendorId: string): Promise<Product[]> => {
    const q = db.collection('products').where('vendorId', '==', vendorId);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(d => mapDocToData<Product>(d));
};

export const apiFetchDeliveryZones = async (): Promise<DeliveryZone[]> => {
    const querySnapshot = await db.collection('deliveryZones').get();
    return querySnapshot.docs.map(d => mapDocToData<DeliveryZone>(d));
};

export const apiPlaceOrder = async (orderData: {
  customerId: string;
  customerName: string;
  vendorId: string;
  items: CartItem[];
  deliveryZone: DeliveryZone;
}): Promise<Order> => {
  const totalPrice = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const newOrderData = {
    ...orderData,
    totalPrice,
    deliveryFee: orderData.deliveryZone.deliveryFee,
    finalAmount: totalPrice + orderData.deliveryZone.deliveryFee,
    status: OrderStatus.PLACED,
    paymentCollected: false,
    createdAt: Date.now(),
    statusHistory: [{ status: OrderStatus.PLACED, timestamp: Date.now() }],
  };

  const docRef = await db.collection('orders').add(newOrderData);
  return { ...newOrderData, id: docRef.id };
};

export const apiFetchCustomerOrders = async (customerId: string): Promise<Order[]> => {
  const q = db.collection('orders').where('customerId', '==', customerId).orderBy('createdAt', 'desc');
  const querySnapshot = await q.get();
  return querySnapshot.docs.map(d => mapDocToData<Order>(d));
};

export const apiCancelOrder = async (orderId: string): Promise<Order> => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const order = mapDocToData<Order>(orderSnap);

    if (!order || order.status !== OrderStatus.PLACED) {
        throw new Error("Order cannot be cancelled.");
    }

    const newStatusHistory = [...order.statusHistory, { status: OrderStatus.CANCELLED, timestamp: Date.now() }];
    await orderRef.update({ status: OrderStatus.CANCELLED, statusHistory: newStatusHistory });
    return { ...order, status: OrderStatus.CANCELLED };
};


// --- Runner ---
export const apiFetchAvailableOrders = async (): Promise<Order[]> => {
    const q = db.collection('orders').where('status', '==', OrderStatus.READY_FOR_PICKUP);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(d => mapDocToData<Order>(d));
};

export const apiAcceptOrder = async (orderId: string, runnerId: string, runnerName: string): Promise<Order> => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const order = mapDocToData<Order>(orderSnap);
    
    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP) {
        throw new Error("Order not available for pickup.");
    }
    
    const newStatusHistory = [...order.statusHistory, { status: OrderStatus.PICKED_UP, timestamp: Date.now() }];
    await orderRef.update({
        runnerId,
        runnerName,
        status: OrderStatus.PICKED_UP,
        statusHistory: newStatusHistory
    });
    return { ...order, runnerId, runnerName, status: OrderStatus.PICKED_UP };
};

export const apiFetchRunnerActiveOrder = async (runnerId: string): Promise<Order | undefined> => {
    const activeStatuses = [OrderStatus.PICKED_UP, OrderStatus.ARRIVING];
    const q = db.collection('orders').where('runnerId', '==', runnerId).where('status', 'in', activeStatuses).limit(1);
    const querySnapshot = await q.get();
    return querySnapshot.empty ? undefined : mapDocToData<Order>(querySnapshot.docs[0]);
};

export const apiUpdateOrderStatusByRunner = async (orderId: string, status: OrderStatus.ARRIVING | OrderStatus.DELIVERED): Promise<Order> => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const order = mapDocToData<Order>(orderSnap);

    const newStatusHistory = [...order.statusHistory, { status, timestamp: Date.now() }];
    const updatePayload: any = { status, statusHistory: newStatusHistory };
    if(status === OrderStatus.DELIVERED) {
        updatePayload.paymentCollected = true;
    }

    await orderRef.update(updatePayload);
    return { ...order, ...updatePayload };
};

export const apiFetchRunnerDailyEarnings = async (runnerId: string): Promise<{orders: Order[], total: number}> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = db.collection('orders')
        .where('runnerId', '==', runnerId)
        .where('status', '==', OrderStatus.DELIVERED)
        .where('createdAt', '>=', today.getTime());
    
    const querySnapshot = await q.get();
    const runnerOrders = querySnapshot.docs.map(d => mapDocToData<Order>(d));
    const total = runnerOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
    return { orders: runnerOrders, total };
};


// --- Canteen/Vendor ---
export const apiFetchVendorOrders = async (vendorId: string): Promise<Order[]> => {
    // In a real app, you would use the logged-in vendor's ID.
    // Here we fetch all non-completed orders for demonstration.
    const statuses = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP];
    const q = db.collection('orders').where('status', 'in', statuses).orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(d => mapDocToData<Order>(d));
};

export const apiUpdateOrderStatusByVendor = async (orderId: string, status: OrderStatus.ACCEPTED | OrderStatus.PREPARING | OrderStatus.READY_FOR_PICKUP): Promise<Order> => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const order = mapDocToData<Order>(orderSnap);

    const newStatusHistory = [...order.statusHistory, { status, timestamp: Date.now() }];
    await orderRef.update({ status, statusHistory: newStatusHistory });
    return { ...order, status };
};

export const apiToggleProductAvailability = async (itemId: string): Promise<Product> => {
    const itemRef = db.collection('products').doc(itemId);
    const itemSnap = await itemRef.get();
    const item = mapDocToData<Product>(itemSnap);
    
    const newAvailability = !item.isAvailable;
    await itemRef.update({ isAvailable: newAvailability });
    return { ...item, isAvailable: newAvailability };
};

// --- Admin ---
export const apiFetchAllRunners = async (): Promise<User[]> => {
    const q = db.collection('users').where('role', '==', Role.RUNNER);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(d => mapDocToData<User>(d));
};

export const apiApproveRunner = async (runnerId: string): Promise<User> => {
    const runnerRef = db.collection('users').doc(runnerId);
    await runnerRef.update({ isApproved: true });
    const runnerSnap = await runnerRef.get();
    return mapDocToData<User>(runnerSnap);
};

export const apiUpdateDeliveryZone = async (zone: DeliveryZone): Promise<DeliveryZone> => {
    const zoneRef = db.collection('deliveryZones').doc(zone.id);
    await zoneRef.update({ name: zone.name, deliveryFee: zone.deliveryFee });
    return zone;
};

export const apiFetchAllOrders = async (): Promise<Order[]> => {
    const q = db.collection('orders').orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(d => mapDocToData<Order>(d));
};

export const apiForceCancelOrder = async (orderId: string): Promise<Order> => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const order = mapDocToData<Order>(orderSnap);

    const newStatusHistory = [...order.statusHistory, { status: OrderStatus.CANCELLED, timestamp: Date.now() }];
    await orderRef.update({ status: OrderStatus.CANCELLED, statusHistory: newStatusHistory });
    return { ...order, status: OrderStatus.CANCELLED };
};