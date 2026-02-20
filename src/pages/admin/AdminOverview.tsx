import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, ShoppingCart, Clock, TrendingUp, Package, CreditCard } from 'lucide-react';
import { formatPrice } from '../../utils';
import { motion } from 'motion/react';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeProducts: 0
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const orders = snap.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalOrders: snap.size,
        pendingOrders: orders.filter(o => o.status === 'pending_approval').length,
        totalRevenue: orders.filter(o => o.status === 'approved' || o.status === 'shipped' || o.status === 'delivered')
          .reduce((sum, o) => sum + o.totalAmount, 0)
      }));
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setStats(prev => ({ ...prev, activeProducts: snap.size }));
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-orange-500' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Active Products', value: stats.activeProducts, icon: Package, color: 'bg-purple-500' },
    { label: 'Total Payments', value: stats.totalOrders, icon: CreditCard, color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6"
          >
            <div className={`${card.color} p-4 rounded-2xl text-white shadow-lg`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity could go here */}
    </div>
  );
};

export default AdminOverview;
