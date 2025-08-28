import { supabase } from './supabaseClient';
import { User, Vendor, Product, DeliveryZone, Order, OrderStatus, Role, CartItem } from '../types';

// Helper to generate a unique enough ID for orders/products
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Data Mapping Helpers ---

const mapUserFromSupabase = (data: any): User => ({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    campusId: data.campus_id,
    isApproved: data.is_approved,
    vendorId: data.vendor_id,
});

const mapOrderFromSupabase = (data: any): Order => ({
    id: data.id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    runnerId: data.runner_id,
    runnerName: data.runner_name,
    vendorId: data.vendor_id,
    items: data.items,
    totalPrice: data.total_price,
    deliveryFee: data.delivery_fee,
    finalAmount: data.final_amount,
    deliveryZone: data.delivery_zone,
    status: data.status,
    paymentCollected: data.payment_collected,
    createdAt: new Date(data.created_at).getTime(),
    statusHistory: data.status_history,
});

const mapVendorFromSupabase = (data: any): Vendor => ({
    id: data.id,
    name: data.name,
    operatingHours: data.operating_hours,
    image: data.image,
});

const mapProductFromSupabase = (data: any): Product => ({
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    isAvailable: data.is_available,
    vendorId: data.vendor_id,
});


// --- Auth & User Profile ---

export const apiGetUserById = async (id: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) {
        console.error("Error fetching user:", error.message);
        return undefined;
    }
    return data ? mapUserFromSupabase(data) : undefined;
};

export const apiCreateUserProfile = async (id: string, name: string, email: string, phone: string | undefined, role: Role, campusId?: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .insert({
            id,
            name,
            email,
            phone,
            role,
            is_approved: role !== Role.RUNNER, // Runners need approval
            campus_id: role === Role.RUNNER ? campusId : undefined,
            vendor_id: role === Role.CANTEEN ? 'vendor1' : undefined, // Default, should be assigned by admin later
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating user profile:", error);
        throw new Error("Could not create user profile.");
    }
    return mapUserFromSupabase(data);
}

// --- Customer ---
export const apiFetchVendors = async (): Promise<Vendor[]> => {
    const { data, error } = await supabase.from('vendors').select('*');
    if (error) throw error;
    return data.map(mapVendorFromSupabase);
};

export const apiFetchVendorById = async (id: string): Promise<Vendor | undefined> => {
    const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single();
    if (error) throw error;
    return data ? mapVendorFromSupabase(data) : undefined;
};

export const apiFetchProductsByVendor = async (vendorId: string): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').eq('vendor_id', vendorId);
    if (error) throw error;
    return data.map(mapProductFromSupabase);
};

export const apiFetchDeliveryZones = async (): Promise<DeliveryZone[]> => {
    const { data, error } = await supabase.from('delivery_zones').select('*');
    if (error) throw error;
    return data.map(z => ({...z, deliveryFee: z.delivery_fee}));
};

export const apiPlaceOrder = async (orderData: {
  customerId: string;
  customerName: string;
  vendorId: string;
  items: CartItem[];
  deliveryZone: DeliveryZone;
}): Promise<Order> => {
  const totalPrice = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = orderData.deliveryZone.deliveryFee;
  const newOrderData = {
    id: generateId('order'),
    customer_id: orderData.customerId,
    customer_name: orderData.customerName,
    vendor_id: orderData.vendorId,
    items: orderData.items,
    delivery_zone: orderData.deliveryZone,
    total_price: totalPrice,
    delivery_fee: deliveryFee,
    final_amount: totalPrice + deliveryFee,
    status: OrderStatus.PLACED,
    payment_collected: false,
    status_history: [{ status: OrderStatus.PLACED, timestamp: Date.now() }],
  };
  
  const { data, error } = await supabase.from('orders').insert(newOrderData).select().single();
  if(error) throw error;
  return mapOrderFromSupabase(data);
};

export const apiFetchCustomerOrders = async (customerId: string): Promise<Order[]> => {
  const { data, error } = await supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapOrderFromSupabase);
};

export const apiCancelOrder = async (orderId: string): Promise<Order> => {
    const { data: existingOrder, error: fetchError } = await supabase.from('orders').select('status, status_history').eq('id', orderId).single();
    if(fetchError || !existingOrder) throw new Error("Order not found");
    if(existingOrder.status !== OrderStatus.PLACED) throw new Error("Order cannot be cancelled.");

    const newStatusHistory = [...existingOrder.status_history, { status: OrderStatus.CANCELLED, timestamp: Date.now() }];
    const { data, error } = await supabase.from('orders').update({ status: OrderStatus.CANCELLED, status_history: newStatusHistory }).eq('id', orderId).select().single();
    if (error) throw error;
    return mapOrderFromSupabase(data);
};

// --- Runner ---
export const apiFetchAvailableOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').eq('status', OrderStatus.READY_FOR_PICKUP);
    if (error) throw error;
    return data.map(mapOrderFromSupabase);
};

export const apiAcceptOrder = async (orderId: string, runnerId: string, runnerName: string): Promise<Order> => {
    const { data: existingOrder, error: fetchError } = await supabase.from('orders').select('status, status_history').eq('id', orderId).single();
    if (fetchError || !existingOrder) throw new Error("Order not found");
    if (existingOrder.status !== OrderStatus.READY_FOR_PICKUP) throw new Error("Order not available for pickup.");
    
    const newStatusHistory = [...existingOrder.status_history, { status: OrderStatus.PICKED_UP, timestamp: Date.now() }];
    const { data, error } = await supabase.from('orders').update({ 
        status: OrderStatus.PICKED_UP, 
        runner_id: runnerId,
        runner_name: runnerName,
        status_history: newStatusHistory
    }).eq('id', orderId).select().single();

    if (error) throw error;
    return mapOrderFromSupabase(data);
};

export const apiFetchRunnerActiveOrder = async (runnerId: string): Promise<Order | undefined> => {
    const activeStatuses = [OrderStatus.PICKED_UP, OrderStatus.ARRIVING];
    const { data, error } = await supabase.from('orders').select('*').eq('runner_id', runnerId).in('status', activeStatuses).maybeSingle();
    if (error) throw error;
    return data ? mapOrderFromSupabase(data) : undefined;
};

export const apiUpdateOrderStatusByRunner = async (orderId: string, status: OrderStatus.ARRIVING | OrderStatus.DELIVERED): Promise<Order> => {
    const { data: existingOrder, error: fetchError } = await supabase.from('orders').select('status_history').eq('id', orderId).single();
    if(fetchError || !existingOrder) throw new Error("Order not found");

    const newStatusHistory = [...existingOrder.status_history, { status, timestamp: Date.now() }];
    const updatePayload: any = { status: status, status_history: newStatusHistory };
    if (status === OrderStatus.DELIVERED) {
        updatePayload.payment_collected = true;
    }
    
    const { data, error } = await supabase.from('orders').update(updatePayload).eq('id', orderId).select().single();
    if (error) throw error;
    return mapOrderFromSupabase(data);
};

export const apiFetchRunnerDailyEarnings = async (runnerId: string): Promise<{orders: Order[], total: number}> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase.from('orders')
        .select('*')
        .eq('runner_id', runnerId)
        .eq('status', OrderStatus.DELIVERED)
        .gte('created_at', today.toISOString());

    if (error) throw error;
    const orders = data.map(mapOrderFromSupabase);
    const total = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
    return { orders, total };
};

// --- Canteen/Vendor ---
export const apiFetchVendorOrders = async (vendorId: string): Promise<Order[]> => {
    const statuses = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP];
    const { data, error } = await supabase.from('orders').select('*').eq('vendor_id', vendorId).in('status', statuses).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapOrderFromSupabase);
};

export const apiUpdateOrderStatusByVendor = async (orderId: string, status: OrderStatus.ACCEPTED | OrderStatus.PREPARING | OrderStatus.READY_FOR_PICKUP): Promise<Order> => {
    const { data: existingOrder, error: fetchError } = await supabase.from('orders').select('status_history').eq('id', orderId).single();
    if(fetchError || !existingOrder) throw new Error("Order not found");
    
    const newStatusHistory = [...existingOrder.status_history, { status, timestamp: Date.now() }];
    const { data, error } = await supabase.from('orders').update({ status: status, status_history: newStatusHistory }).eq('id', orderId).select().single();
    if (error) throw error;
    return mapOrderFromSupabase(data);
};

export const apiToggleProductAvailability = async (itemId: string): Promise<Product> => {
    const { data: product, error: fetchError } = await supabase.from('products').select('is_available').eq('id', itemId).single();
    if(fetchError || !product) throw new Error("Product not found");

    const { data, error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', itemId).select().single();
    if (error) throw error;
    return mapProductFromSupabase(data);
};

// --- Admin ---
export const apiFetchAllRunners = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('role', Role.RUNNER);
    if (error) throw error;
    return data.map(mapUserFromSupabase);
};

export const apiApproveRunner = async (runnerId: string): Promise<User> => {
    const { data, error } = await supabase.from('users').update({ is_approved: true }).eq('id', runnerId).select().single();
    if (error) throw error;
    return mapUserFromSupabase(data);
};

export const apiUpdateDeliveryZone = async (zone: DeliveryZone): Promise<DeliveryZone> => {
    const { data, error } = await supabase.from('delivery_zones').update({ name: zone.name, delivery_fee: zone.deliveryFee }).eq('id', zone.id).select().single();
    if (error) throw error;
    return {...data, deliveryFee: data.delivery_fee};
};

export const apiFetchAllOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapOrderFromSupabase);
};

export const apiForceCancelOrder = async (orderId: string): Promise<Order> => {
    const { data: existingOrder, error: fetchError } = await supabase.from('orders').select('status_history').eq('id', orderId).single();
    if(fetchError || !existingOrder) throw new Error("Order not found");

    const newStatusHistory = [...existingOrder.status_history, { status: OrderStatus.CANCELLED, timestamp: Date.now() }];
    const { data, error } = await supabase.from('orders').update({ status: OrderStatus.CANCELLED, status_history: newStatusHistory }).eq('id', orderId).select().single();
    if (error) throw error;
    return mapOrderFromSupabase(data);
};