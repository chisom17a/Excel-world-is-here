import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import { formatPrice } from '../utils';
import { motion } from 'motion/react';
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending_payment': return <Clock className="text-gray-400" size={20} />;
      case 'pending_approval': return <Clock className="text-orange-400" size={20} />;
      case 'approved': return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected': return <XCircle className="text-red-500" size={20} />;
      case 'shipped': return <Truck className="text-blue-500" size={20} />;
      case 'delivered': return <Package className="text-green-600" size={20} />;
      default: return <ShoppingBag size={20} />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-orange-600 mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back to Profile</span>
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 pb-6 border-b border-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-sm font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                      <p className="text-sm font-bold text-gray-900">{getStatusText(order.status)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${
                      order.status === 'approved' || order.status === 'delivered' ? 'bg-green-50' : 
                      order.status === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
                    }`}>
                      {getStatusIcon(order.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-lg font-black text-orange-600">{formatPrice(order.totalAmount)}</p>
                </div>

                {order.status === 'rejected' && order.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl text-red-800 text-sm">
                    <p className="font-bold mb-1">Rejection Reason:</p>
                    <p>{order.rejectionReason}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
