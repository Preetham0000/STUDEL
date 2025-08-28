import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/apiService';
import { Order, Product, OrderStatus } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { getOrderStatusColor } from '../constants';
import Notification from '../components/common/Notification';
import Header from '../components/Header';

const CanteenPortal: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'orders' | 'products' | 'summary'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        // FIX: Use the logged-in user's vendorId to fetch their specific data.
        if (!user || !user.vendorId) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        try {
            const [ordersData, productsData] = await Promise.all([
                api.apiFetchVendorOrders(user.vendorId), 
                api.apiFetchProductsByVendor(user.vendorId),
            ]);
            setOrders(ordersData);
            setProducts(productsData);
        } catch (error) {
            setNotification({ message: 'Failed to load canteen data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll for new orders
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
        setIsSubmitting(orderId);
        try {
            await api.apiUpdateOrderStatusByVendor(orderId, status as any);
            setNotification({ message: `Order #${orderId.slice(-6)} updated to ${status}.`, type: 'success' });
            fetchData();
        } catch (error) {
            setNotification({ message: 'Failed to update order status.', type: 'error' });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const handleToggleAvailability = async (itemId: string) => {
        setIsSubmitting(itemId);
        try {
            await api.apiToggleProductAvailability(itemId);
            setNotification({ message: 'Product updated.', type: 'success' });
            // Refetch only menu data in a real app
            fetchData();
        } catch (error) {
            setNotification({ message: 'Failed to update product.', type: 'error' });
        } finally {
            setIsSubmitting(null);
        }
    }

    const dailySummary = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysOrders = orders.filter(o => o.createdAt >= today.getTime() && o.status !== OrderStatus.CANCELLED);
        const totalRevenue = todaysOrders.reduce((sum, o) => sum + o.totalPrice, 0); // Revenue for vendor is without delivery fee
        return {
            orderCount: todaysOrders.length,
            totalRevenue,
        };
    }, [orders]);
    
    const OrderQueue = () => {
        const newOrders = orders.filter(o => o.status === OrderStatus.PLACED);
        const preparingOrders = orders.filter(o => [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status));
        const readyOrders = orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP);
        
        return (
            <div>
                 <h2 className="text-2xl font-display font-bold mb-4">Order Dashboard</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* New Orders */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-blue-600">New Orders ({newOrders.length})</h3>
                        {newOrders.map(order => (
                            <Card key={order.id}>
                                <div className="p-4 border-b">
                                    <p className="font-bold">Order #{order.id.slice(-6)}</p>
                                    <p className="text-sm text-gray-500">From: {order.customerName}</p>
                                </div>
                                <ul className="p-4 text-sm space-y-1">
                                    {order.items.map(i => <li key={i.id}>{i.quantity} x {i.name}</li>)}
                                </ul>
                                <div className="p-4 bg-gray-50">
                                    <Button className="w-full" onClick={() => handleUpdateStatus(order.id, OrderStatus.ACCEPTED)} isLoading={isSubmitting === order.id}>Accept Order</Button>
                                </div>
                            </Card>
                        ))}
                        {newOrders.length === 0 && <p className="text-gray-500">No new orders.</p>}
                    </div>
                    {/* Preparing */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-yellow-600">Preparing ({preparingOrders.length})</h3>
                        {preparingOrders.map(order => (
                            <Card key={order.id}>
                                <div className="p-4 border-b">
                                    <p className="font-bold">Order #{order.id.slice(-6)}</p>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                                </div>
                                <ul className="p-4 text-sm space-y-1">
                                    {order.items.map(i => <li key={i.id}>{i.quantity} x {i.name}</li>)}
                                </ul>
                                <div className="p-4 bg-gray-50 flex gap-2">
                                {order.status === OrderStatus.ACCEPTED && 
                                    <Button variant="secondary" className="w-full" onClick={() => handleUpdateStatus(order.id, OrderStatus.PREPARING)} isLoading={isSubmitting === order.id}>Start Preparing</Button>
                                }
                                {order.status === OrderStatus.PREPARING && 
                                    <Button className="w-full" onClick={() => handleUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)} isLoading={isSubmitting === order.id}>Ready for Pickup</Button>
                                }
                                </div>
                            </Card>
                        ))}
                        {preparingOrders.length === 0 && <p className="text-gray-500">No orders being prepared.</p>}
                    </div>
                    {/* Ready for Pickup */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-green-600">Ready for Pickup ({readyOrders.length})</h3>
                        {readyOrders.map(order => (
                            <Card key={order.id}>
                                <div className="p-4">
                                    <p className="font-bold">Order #{order.id.slice(-6)}</p>
                                    <p className="text-sm text-gray-500">Waiting for runner...</p>
                                </div>
                            </Card>
                        ))}
                        {readyOrders.length === 0 && <p className="text-gray-500">No orders ready for pickup.</p>}
                    </div>
                </div>
            </div>
        );
    };
    
    const ProductManagement = () => (
        <div>
            <h2 className="text-2xl font-display font-bold mb-4">Manage Products & Services</h2>
            <Card>
                <ul className="divide-y divide-gray-200">
                {products.map(item => (
                    <li key={item.id} className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`text-sm font-medium ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {item.isAvailable ? 'Available' : 'Out of Stock'}
                            </span>
                             <button
                                onClick={() => handleToggleAvailability(item.id)}
                                disabled={isSubmitting === item.id}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${item.isAvailable ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}/>
                            </button>
                        </div>
                    </li>
                ))}
                </ul>
            </Card>
        </div>
    );
    
    const DailySummary = () => (
         <div>
            <h2 className="text-2xl font-display font-bold mb-4">Daily Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 text-center">
                    <p className="text-lg text-gray-600">Total Orders Today</p>
                    <p className="text-5xl font-extrabold font-display text-primary-600">{dailySummary.orderCount}</p>
                </Card>
                <Card className="p-6 text-center">
                    <p className="text-lg text-gray-600">Shop Revenue Today</p>
                    <p className="text-5xl font-extrabold font-display text-green-600">₹{dailySummary.totalRevenue.toFixed(2)}</p>
                </Card>
            </div>
         </div>
    );

    if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>;


    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
                <div className="flex border border-gray-200 rounded-lg p-1 space-x-1 bg-gray-100 mb-6 w-min">
                    <Button variant={view === 'orders' ? 'primary' : 'secondary'} onClick={() => setView('orders')} className="!px-6 !py-2 !shadow-none">Orders</Button>
                    <Button variant={view === 'products' ? 'primary' : 'secondary'} onClick={() => setView('products')} className="!px-6 !py-2 !shadow-none">Products</Button>
                    <Button variant={view === 'summary' ? 'primary' : 'secondary'} onClick={() => setView('summary')} className="!px-6 !py-2 !shadow-none">Summary</Button>
                </div>
                
                {view === 'orders' && <OrderQueue />}
                {view === 'products' && <ProductManagement />}
                {view === 'summary' && <DailySummary />}
            </main>
        </div>
    );
};

export default CanteenPortal;