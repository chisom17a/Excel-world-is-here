import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingCart, CreditCard, 
  Truck, Package, Plus, Search, Eye, Edit, Trash2, 
  Mail, Check, X, ArrowRight, AlertCircle, TrendingUp
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc, increment, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Product, UserProfile, Order, Notification } from '../types';
import { formatPrice, cn, uploadToImgBB } from '../utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// Sub-components
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminOrders from './admin/AdminOrders';
import AdminPayments from './admin/AdminPayments';
import AdminShipment from './admin/AdminShipment';
import AdminProducts from './admin/AdminProducts';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'shipment', label: 'Shipment', icon: Truck, path: '/admin/shipment' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
  ];

  const activeTab = tabs.find(t => t.path === location.pathname)?.id || 'overview';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 p-6 space-y-8">
        <div className="flex items-center space-x-2 px-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="text-lg font-black text-gray-900 tracking-tight">Admin Panel</span>
        </div>

        <nav className="space-y-1">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-2xl transition-all font-medium",
                activeTab === tab.id 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                  : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/payments" element={<AdminPayments />} />
          <Route path="/shipment" element={<AdminShipment />} />
          <Route path="/products" element={<AdminProducts />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
