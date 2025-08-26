
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import { User, DeliveryZone, Order } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Notification from '../components/common/Notification';
import { getOrderStatusColor } from '../constants';
import Header from '../components/Header';

const AdminPortal: React.FC = () => {
    const [view, setView] = useState<'runners' | 'zones' | 'orders'>('runners');
    const [runners, setRunners] = useState<User[]>([]);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [runnersData, zonesData, ordersData] = await Promise.all([
                api.apiFetchAllRunners(),
                api.apiFetchDeliveryZones(),
                api.apiFetchAllOrders(),
            ]);
            setRunners(runnersData);
            setZones(zonesData);
            setOrders(ordersData);
        } catch (error) {
            setNotification({ message: 'Failed to load data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApproveRunner = async (runnerId: string) => {
        setIsSubmitting(runnerId);
        try {
            await api.apiApproveRunner(runnerId);
            setNotification({ message: 'Runner approved successfully!', type: 'success' });
            fetchData();
        } catch (error) {
            setNotification({ message: 'Failed to approve runner.', type: 'error' });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const handleForceCancel = async (orderId: string) => {
        if(window.confirm('Are you sure you want to cancel this order?')){
            setIsSubmitting(orderId);
            try {
                await api.apiForceCancelOrder(orderId);
                setNotification({ message: 'Order cancelled.', type: 'success' });
                fetchData();
            } catch (error) {
                setNotification({ message: 'Failed to cancel order.', type: 'error' });
            } finally {
                setIsSubmitting(null);
            }
        }
    }

    const RunnerApproval = () => (
        <Card>
            <h3 className="text-xl font-bold p-4 border-b">Runner Management</h3>
            <ul className="divide-y divide-gray-200">
                {runners.map(runner => (
                    <li key={runner.id} className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{runner.name}</p>
                            <p className="text-sm text-gray-500">ID: {runner.campusId} | Phone: {runner.phone}</p>
                        </div>
                        {runner.isApproved ? (
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">Approved</span>
                        ) : (
                            <Button onClick={() => handleApproveRunner(runner.id)} isLoading={isSubmitting === runner.id}>
                                Approve
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );

    const ZoneManagement = () => (
        <Card>
            <h3 className="text-xl font-bold p-4 border-b">Delivery Zones & Fees</h3>
            <ul className="divide-y divide-gray-200">
                {zones.map(zone => (
                    <li key={zone.id} className="p-4 flex justify-between items-center">
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-gray-700">₹{zone.deliveryFee.toFixed(2)}</p>
                    </li>
                ))}
                 <li className="p-4 text-sm text-gray-500">Zone management UI to be added.</li>
            </ul>
        </Card>
    );
    
    const OrderView = () => (
        <Card>
            <h3 className="text-xl font-bold p-4 border-b">All Orders</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.slice(-6)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.runnerName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.finalAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                        <Button variant="danger" onClick={() => handleForceCancel(order.id)} isLoading={isSubmitting === order.id}>
                                            Cancel
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>;


    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
                <div className="flex border border-gray-200 rounded-lg p-1 space-x-1 bg-gray-100 mb-6 w-min">
                    <Button variant={view === 'runners' ? 'primary' : 'secondary'} onClick={() => setView('runners')} className="!px-6 !py-2 !shadow-none">Runners</Button>
                    <Button variant={view === 'zones' ? 'primary' : 'secondary'} onClick={() => setView('zones')} className="!px-6 !py-2 !shadow-none">Zones</Button>
                    <Button variant={view === 'orders' ? 'primary' : 'secondary'} onClick={() => setView('orders')} className="!px-6 !py-2 !shadow-none">Orders</Button>
                </div>

                {view === 'runners' && <RunnerApproval />}
                {view === 'zones' && <ZoneManagement />}
                {view === 'orders' && <OrderView />}
            </main>
        </div>
    );
};

export default AdminPortal;