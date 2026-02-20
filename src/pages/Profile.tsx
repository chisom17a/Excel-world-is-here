import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { updatePassword, updateProfile as updateAuthProfile } from 'firebase/auth';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { User, Settings, ShoppingBag, Wallet, Bell, Lock, Edit2, CheckCircle, Clock } from 'lucide-react';
import { formatPrice } from '../utils';
import { Notification } from '../types';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [newPassword, setNewPassword] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!user || !fullName) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { fullName });
      await updateAuthProfile(user, { displayName: fullName });
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      toast.error('Error updating name');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please re-login to change password');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={48} className="text-orange-600" />
              </div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-b-2 border-orange-600 focus:outline-none text-center font-bold text-xl"
                    />
                    <button onClick={handleUpdateName} className="text-green-600"><CheckCircle size={20} /></button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                    <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-orange-600">
                      <Edit2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-6">{user?.email}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Cashback</p>
                  <p className="text-lg font-black text-orange-600">{formatPrice(profile?.cashbackBalance || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Orders</p>
                  <p className="text-lg font-black text-gray-900">{profile?.totalOrders || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100"
            >
              <nav className="space-y-1">
                <Link to="/orders" className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-all">
                  <ShoppingBag size={20} />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link to="/transactions" className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-all">
                  <Wallet size={20} />
                  <span className="font-medium">Transactions</span>
                </Link>
              </nav>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Security Settings */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="text-orange-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">New Password</label>
                  <div className="flex space-x-4">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="flex-1 bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !newPassword}
                      className="bg-orange-600 text-white px-6 rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Notifications */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Bell className="text-orange-600" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                </div>
                {notifications.some(n => !n.read) && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notif.read ? 'bg-gray-50 border-gray-100' : 'bg-orange-50 border-orange-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-1" />
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
