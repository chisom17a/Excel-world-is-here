import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { UserProfile, Order } from '../../types';
import { formatPrice } from '../../utils';
import { Search, Eye, Mail, Edit, X, ArrowRight, Wallet, ShoppingBag, Calendar, User as UserIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isEditingCashback, setIsEditingCashback] = useState(false);
  const [newCashback, setNewCashback] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsub();
  }, []);

  const fetchUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setUserOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    setNewCashback(user.cashbackBalance);
  };

  const handleUpdateCashback = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        cashbackBalance: newCashback
      });
      toast.success('Cashback balance updated');
      setIsEditingCashback(false);
      setSelectedUser({ ...selectedUser, cashbackBalance: newCashback });
    } catch (error) {
      toast.error('Error updating cashback');
    }
  };

  const handleSendResetLink = async (email: string) => {
    if (window.confirm(`Send password reset link to ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success('Reset link sent successfully');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500">Manage all registered users and their accounts.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-gray-100 rounded-2xl py-3 pl-12 pr-4 w-full md:w-80 focus:ring-2 focus:ring-orange-500 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total Orders</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cashback</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {user.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">{user.totalOrders}</td>
                  <td className="px-6 py-4 font-bold text-orange-600">{formatPrice(user.cashbackBalance)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => fetchUserDetails(user)}
                        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        title="View Profile"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => handleSendResetLink(user.email)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Send Reset Link"
                      >
                        <Mail size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">User Profile</h2>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {/* Basic Info */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-orange-600">
                        {selectedUser.fullName[0]}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedUser.fullName}</h3>
                      <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {selectedUser.role}
                      </span>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center space-x-3 text-sm">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-gray-600">Joined {new Date(selectedUser.dateJoined).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Wallet size={18} className="text-gray-400" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-gray-600">Cashback</span>
                          {isEditingCashback ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={newCashback}
                                onChange={(e) => setNewCashback(Number(e.target.value))}
                                className="w-20 border-b border-orange-600 text-right font-bold"
                              />
                              <button onClick={handleUpdateCashback} className="text-green-600"><Check size={16} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-orange-600">{formatPrice(selectedUser.cashbackBalance)}</span>
                              <button onClick={() => setIsEditingCashback(true)} className="text-gray-400 hover:text-orange-600"><Edit size={14} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Orders */}
                  <div className="md:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Spending</p>
                        <p className="text-2xl font-black text-gray-900">{formatPrice(selectedUser.totalSpending)}</p>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-2xl font-black text-gray-900">{selectedUser.totalOrders}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <ShoppingBag size={20} className="mr-2 text-orange-600" />
                        Order History
                      </h4>
                      <div className="space-y-3">
                        {userOrders.length > 0 ? userOrders.map(order => (
                          <div key={order.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                              <span className="text-[10px] font-bold uppercase text-orange-600">{order.status}</span>
                            </div>
                          </div>
                        )) : (
                          <p className="text-center py-8 text-gray-400 italic">No orders found for this user.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
