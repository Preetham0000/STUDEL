import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/apiService';
import { Product, CartItem, DeliveryZone, Order, Vendor, OrderStatus } from '../types';
import { PlusCircleIcon, MinusCircleIcon, ShoppingCartIcon } from '../components/Icons';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { getOrderStatusColor, ORDER_STATUS_FLOW } from '../constants';
import Notification from '../components/common/Notification';
import Header from '../components/Header';


const CustomerPortal: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<'vendors' | 'products' | 'cart' | 'orders'>('vendors');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [vendorsData, zonesData] = await Promise.all([
                api.apiFetchVendors(),
                api.apiFetchDeliveryZones(),
            ]);
            setVendors(vendorsData);
            setZones(zonesData);
             if (isAuthenticated && user) {
                const ordersData = await api.apiFetchCustomerOrders(user.id);
                setOrders(ordersData);
            }
        } catch (error) {
            setNotification({ message: 'Failed to load data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleVendorSelect = async (vendor: Vendor) => {
        setIsLoading(true);
        setView('products');
        setSelectedVendor(vendor);
        try {
            const productData = await api.apiFetchProductsByVendor(vendor.id);
            setProducts(productData);
        } catch(e) {
            setNotification({ message: 'Failed to load products.', type: 'error' });
            setView('vendors');
        } finally {
            setIsLoading(false);
        }
    };

    const groupedProducts = useMemo(() => {
        return products.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [products]);

    const addToCart = (item: Product) => {
        if (cart.length > 0 && cart[0].vendorId !== item.vendorId) {
            if (window.confirm("Your cart has items from another shop. Clear cart to add this item?")) {
                setCart([{...item, quantity: 1}]);
            }
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity === 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== itemId));
        } else {
            setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity } : item));
        }
    };
    
    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    const placeOrder = async (deliveryZone: DeliveryZone) => {
        if (!user || !selectedVendor || !isAuthenticated) return;
        setIsLoading(true);
        try {
            await api.apiPlaceOrder({
                customerId: user.id,
                customerName: user.name,
                vendorId: selectedVendor.id,
                items: cart,
                deliveryZone,
            });
            setCart([]);
            setView('orders');
            fetchInitialData(); // Refresh orders list
            setNotification({ message: 'Order placed successfully!', type: 'success' });
        } catch (error) {
            setNotification({ message: 'Failed to place order.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            await api.apiCancelOrder(orderId);
            fetchInitialData();
            setNotification({ message: 'Order cancelled.', type: 'success' });
        } catch (error) {
            setNotification({ message: 'Could not cancel order.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }

    const renderVendorList = () => (
        <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-gray-900 mb-6">Shops & Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                    <Card key={vendor.id} className="group cursor-pointer transform hover:scale-105 transition-transform duration-200 overflow-hidden" onClick={() => handleVendorSelect(vendor)}>
                        <div className="relative">
                            <img src={vendor.image} alt={vendor.name} className="h-48 w-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 transition-all"></div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-xl font-display font-bold text-gray-800">{vendor.name}</h3>
                            <p className="text-sm text-gray-500">{vendor.operatingHours}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderProductList = () => (
        <div>
            <button onClick={() => { setView('vendors'); setProducts([]); setSelectedVendor(null); }} className="mb-4 inline-flex items-center text-primary-600 hover:underline">
                &larr; Back to all Shops
            </button>
            <h2 className="text-2xl font-display font-bold mb-4">{selectedVendor?.name}</h2>
             {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category} className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(items as Product[]).map(item => (
                            <Card key={item.id} className={`flex flex-col justify-between ${!item.isAvailable ? 'opacity-50' : ''}`}>
                                <div className="p-4">
                                    <h4 className="font-bold text-lg">{item.name}</h4>
                                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                                    <p className="font-semibold text-primary-600">₹{item.price.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 text-right">
                                    {item.isAvailable ? (
                                        <Button variant="secondary" onClick={() => isAuthenticated ? addToCart(item) : navigate('/login')}>Add to Cart</Button>
                                    ) : (
                                        <span className="text-sm font-medium text-red-500">Out of stock</span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
    
    const CartView = () => {
        const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
        const selectedZone = zones.find(z => z.id === selectedZoneId);

        return (
            <div>
                 <button onClick={() => setView('products')} className="mb-4 inline-flex items-center text-primary-600 hover:underline">
                    &larr; Back to Products
                </button>
                <h2 className="text-2xl font-display font-bold mb-4">Your Cart</h2>
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <Card className="divide-y divide-gray-200">
                        {cart.map(item => (
                            <div key={item.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircleIcon className="w-6 h-6 text-gray-500 hover:text-red-500" /></button>
                                    <span className="font-medium w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircleIcon className="w-6 h-6 text-gray-500 hover:text-green-500" /></button>
                                </div>
                                <p className="font-semibold w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                         <div className="p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <p>Subtotal:</p>
                                <p className="font-semibold">₹{cartTotal.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <p>Delivery Fee:</p>
                                <p className="font-semibold">₹{selectedZone?.deliveryFee.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold text-primary-700">
                                <p>Total:</p>
                                <p>₹{(cartTotal + (selectedZone?.deliveryFee || 0)).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="p-4">
                           <h3 className="text-lg font-medium mb-2">Delivery Details</h3>
                           <div className="mb-4">
                               <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Drop Location</label>
                               <select id="zone" value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                   {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                               </select>
                           </div>
                           <div className="mb-2">
                               <p className="font-medium">Payment Method:</p>
                               <p className="text-gray-600">UPI on Delivery (COD)</p>
                           </div>
                           <Button className="w-full mt-4" onClick={() => selectedZone && placeOrder(selectedZone)} disabled={!selectedZone || isLoading}>
                               Place Order
                           </Button>
                        </div>
                    </Card>
                )}
            </div>
        );
    };
    
    const OrdersView = () => (
        <div>
            <h2 className="text-2xl font-display font-bold mb-4">My Orders</h2>
            {orders.length === 0 ? <p>You have no orders yet.</p> : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <Card key={order.id}>
                            <div className="p-4 border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg">Order #{order.id.slice(-6)}</p>
                                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>Delivering to: <span className="font-medium">{order.deliveryZone.name}</span></p>
                                    <p>Total: <span className="font-medium">₹{order.finalAmount.toFixed(2)}</span></p>
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="font-semibold mb-2">Items</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {order.items.map(item => <li key={item.id}>{item.quantity} x {item.name}</li>)}
                                </ul>
                            </div>
                            <div className="p-4 bg-gray-50">
                                <h4 className="font-semibold mb-3">Order Progress</h4>
                                <div className="flex justify-between text-xs text-center">
                                    {ORDER_STATUS_FLOW.map((status, index) => {
                                        const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
                                        const isCompleted = index <= currentStatusIndex;
                                        return (
                                            <div key={status} className={`flex-1 ${isCompleted ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                                                <div className="relative mb-2">
                                                    <div className={`w-full h-1 ${index < ORDER_STATUS_FLOW.length -1 ? 'absolute top-1/2 -translate-y-1/2' : ''} ${index <= currentStatusIndex -1 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                                                    <div className={`w-4 h-4 rounded-full mx-auto ${isCompleted ? 'bg-primary-600' : 'bg-gray-300'} border-2 border-white`}></div>
                                                </div>
                                                <p>{status}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {order.status === OrderStatus.PLACED && (
                                <div className="p-4 border-t text-right">
                                    <Button variant="danger" onClick={() => handleCancelOrder(order.id)} isLoading={isLoading}>Cancel Order</Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    if (isLoading && vendors.length === 0) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50">
             <Header />
             <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                 {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex border border-gray-200 rounded-lg p-1 space-x-1 bg-gray-100">
                        <Button variant={['vendors', 'products', 'cart'].includes(view) ? 'primary' : 'secondary'} onClick={() => setView('vendors')} className="!px-6 !py-2 !shadow-none">Order</Button>
                        {isAuthenticated && (
                            <Button variant={view === 'orders' ? 'primary' : 'secondary'} onClick={() => setView('orders')} className="!px-6 !py-2 !shadow-none">My Orders</Button>
                        )}
                    </div>
                    {isAuthenticated && (
                        <button onClick={() => setView('cart')} className="relative p-2 rounded-full hover:bg-gray-100">
                            <ShoppingCartIcon className="w-8 h-8 text-primary-600"/>
                            {cart.length > 0 && <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>}
                        </button>
                    )}
                </div>
                {view === 'vendors' && renderVendorList()}
                {view === 'products' && (isLoading ? <Spinner /> : renderProductList())}
                {isAuthenticated && view === 'cart' && <CartView />}
                {isAuthenticated && view === 'orders' && <OrdersView />}
             </main>
        </div>
    );
};

export default CustomerPortal;