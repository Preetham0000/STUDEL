
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/apiService';
import { Order, OrderStatus } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import { getOrderStatusColor } from '../constants';
import Notification from '../components/common/Notification';
import Header from '../components/Header';

const RunnerPortal: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'orders' | 'earnings'>('orders');
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [dailyEarnings, setDailyEarnings] = useState<{orders: Order[], total: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [activeOrderData, availableOrdersData, earningsData] = await Promise.all([
                api.apiFetchRunnerActiveOrder(user.id),
                api.apiFetchAvailableOrders(),
                api.apiFetchRunnerDailyEarnings(user.id)
            ]);
            setActiveOrder(activeOrderData || null);
            setAvailableOrders(availableOrdersData);
            setDailyEarnings(earningsData);
        } catch (error) {
            setNotification({ message: 'Failed to load data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Poll for new orders
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleAcceptOrder = async (orderId: string) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await api.apiAcceptOrder(orderId, user.id, user.name);
            setNotification({ message: 'Order accepted!', type: 'success' });
            fetchData();
        } catch (error) {
            setNotification({ message: 'Failed to accept order. It might have been taken.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateStatus = async (orderId: string, status: OrderStatus.ARRIVING | OrderStatus.DELIVERED) => {
        setIsSubmitting(true);
        try {
            await api.apiUpdateOrderStatusByRunner(orderId, status);
            setNotification({ message: `Order status updated to ${status}!`, type: 'success' });
            fetchData();
        } catch (error) {
            setNotification({ message: 'Failed to update status.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const UnapprovedView = () => (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-yellow-700">Account Pending Approval</h2>
            <p className="mt-2 text-gray-600">Your account is waiting for admin approval. Please check back later.</p>
        </div>
    );
    
    const ActiveOrderView = () => activeOrder && (
        <Card className="mb-8 border-2 border-primary-500">
            <div className="p-4 bg-primary-50">
                <h3 className="text-xl font-bold text-primary-700">Your Active Delivery</h3>
                <p className="text-sm text-primary-600">Order #{activeOrder.id.slice(-6)}</p>
            </div>
            <div className="p-4 space-y-3">
                <p><strong>Customer:</strong> {activeOrder.customerName}</p>
                <p><strong>Drop Location:</strong> {activeOrder.deliveryZone.name}</p>
                <p><strong>Items:</strong> {activeOrder.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                <p><strong>Payment:</strong> UPI on Delivery - <span className="font-bold">₹{activeOrder.finalAmount.toFixed(2)}</span></p>
                <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(activeOrder.status)}`}>{activeOrder.status}</span></p>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col sm:flex-row gap-4">
                {activeOrder.status === OrderStatus.PICKED_UP &&
                    <Button className="flex-1" onClick={() => handleUpdateStatus(activeOrder.id, OrderStatus.ARRIVING)} isLoading={isSubmitting}>Mark as Arriving</Button>
                }
                {activeOrder.status === OrderStatus.ARRIVING &&
                    <Button className="flex-1" onClick={() => handleUpdateStatus(activeOrder.id, OrderStatus.DELIVERED)} isLoading={isSubmitting}>Mark as Delivered</Button>
                }
            </div>
        </Card>
    );

    const AvailableOrdersView = () => (
        <div>
            <h3 className="text-xl font-bold mb-4">Available for Pickup</h3>
            {availableOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableOrders.map(order => (
                        <Card key={order.id}>
                            <div className="p-4">
                                <p className="font-bold">Order #{order.id.slice(-6)}</p>
                                <p className="text-sm text-gray-600">To: {order.deliveryZone.name}</p>
                                <p className="text-sm text-gray-600">Items: {order.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 flex justify-between items-center">
                                <p className="font-bold text-green-600">Fee: ₹{order.deliveryFee.toFixed(2)}</p>
                                <Button variant="secondary" onClick={() => handleAcceptOrder(order.id)} isLoading={isSubmitting}>Accept</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No available orders right now. Check back soon!</p>
            )}
        </div>
    );

    const EarningsView = () => (
        <div>
            <h2 className="text-2xl font-bold mb-4">Today's Earnings</h2>
            <Card className="mb-6">
                <div className="p-6 text-center">
                    <p className="text-lg text-gray-600">Total Earnings Today</p>
                    <p className="text-5xl font-extrabold text-green-600">₹{dailyEarnings?.total.toFixed(2) || '0.00'}</p>
                    <p className="text-gray-500 mt-1">{dailyEarnings?.orders.length || 0} deliveries completed</p>
                </div>
            </Card>
            <h3 className="text-xl font-bold mb-4">Completed Deliveries</h3>
            <div className="space-y-4">
                {dailyEarnings && dailyEarnings.orders.length > 0 ? (
                    dailyEarnings.orders.map(order => (
                        <Card key={order.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Order #{order.id.slice(-6)}</p>
                                <p className="text-sm text-gray-500">Delivered to {order.deliveryZone.name}</p>
                            </div>
                            <p className="font-bold text-green-600">+ ₹{order.deliveryFee.toFixed(2)}</p>
                        </Card>
                    ))
                ) : (
                    <p className="text-gray-500">No deliveries completed today.</p>
                )}
            </div>
        </div>
    );
    
    if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
                
                {user && !user.isApproved ? <UnapprovedView /> : (
                    <>
                        <div className="flex border border-gray-200 rounded-lg p-1 space-x-1 bg-gray-100 mb-6 w-min">
                            <Button variant={view === 'orders' ? 'primary' : 'secondary'} onClick={() => setView('orders')} className="!px-6 !py-2 !shadow-none">Orders</Button>
                            <Button variant={view === 'earnings' ? 'primary' : 'secondary'} onClick={() => setView('earnings')} className="!px-6 !py-2 !shadow-none">Earnings</Button>
                        </div>

                        {view === 'orders' && (
                            <div>
                                {activeOrder ? <ActiveOrderView /> : <AvailableOrdersView />}
                            </div>
                        )}
                        {view === 'earnings' && <EarningsView />}
                    </>
                )}
            </main>
        </div>
    );
};

export default RunnerPortal;