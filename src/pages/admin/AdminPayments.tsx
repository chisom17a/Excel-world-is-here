import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, increment, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { formatPrice, cn } from '../../utils';
import { Search, Eye, Check, X, Clock, CreditCard, User, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
    return () => unsub();
  }, []);

  const handleApprovePayment = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'approved' // Moves to marketing/shipment
      });

      // Update user total spending
      await updateDoc(doc(db, 'users', order.userId), {
        totalSpending: increment(order.totalAmount),
        totalOrders: increment(1)
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        message: `The finance department has received your payment for order #${order.id.slice(-6).toUpperCase()} and has sent it to the marketing department to deliver it to ${order.shipmentDetails.address}.`,
        type: 'success',
        read: false,
        createdAt: Date.now()
      });

      toast.success('Payment verified and approved');
    } catch (error) {
      toast.error('Error approving payment');
    }
  };

  const handleRejectPayment = async (order: Order) => {
    if (window.confirm('Reject this payment proof?')) {
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'rejected'
        });

        // Notify user
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          message: `The payment of ${formatPrice(order.totalAmount)} for order #${order.id.slice(-6).toUpperCase()} wasn't received. Please contact us for more information on WhatsApp +2349039226769.`,
          type: 'error',
          read: false,
          createdAt: Date.now()
        });

        toast.success('Payment proof rejected');
      } catch (error) {
        toast.error('Error rejecting payment');
      }
    }
  };

  // Sort: Unverified first
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
    if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
    return b.createdAt - a.createdAt;
  });

  const filteredOrders = sortedOrders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.paymentProof?.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Verification</h1>
          <p className="text-gray-500">Verify bank transfers and payment proofs.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, email or sender..."
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sender / Order</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Proof</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={cn(
                  "hover:bg-gray-50 transition-colors",
                  order.status === 'pending_approval' ? 'bg-orange-50/30' : ''
                )}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{order.paymentProof?.senderName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Order: #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400">{order.userEmail}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-orange-600">{formatPrice(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.paymentProof?.imageUrl ? (
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowProof(true);
                        }}
                        className="flex items-center space-x-1 text-orange-600 font-bold text-xs hover:underline"
                      >
                        <Eye size={14} />
                        <span>View Proof</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {order.status === 'pending_approval' ? (
                        <>
                          <button 
                            onClick={() => handleApprovePayment(order)}
                            className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                            title="Approve Payment"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectPayment(order)}
                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                            title="Reject Payment"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                          title="View Order Details"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      <AnimatePresence>
        {showProof && selectedOrder && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProof(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Payment Receipt</h3>
                <button onClick={() => setShowProof(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[400px]">
                <img 
                  src={selectedOrder.paymentProof?.imageUrl} 
                  alt="Proof" 
                  className="max-w-full max-h-[70vh] rounded-xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 bg-white flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Sender Name</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOrder.paymentProof?.senderName}</p>
                </div>
                <a 
                  href={selectedOrder.paymentProof?.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-orange-600 font-bold hover:underline"
                >
                  <ExternalLink size={18} />
                  <span>Open Original</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal (Reuse AdminOrders logic if needed, or keep simple) */}
      <AnimatePresence>
        {selectedOrder && !showProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Order Info</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-500">Status</span>
                  <span className="font-bold uppercase text-orange-600">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-bold text-gray-900">{selectedOrder.userEmail}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <p className="text-xs font-bold text-orange-400 uppercase mb-2">Shipment Address</p>
                  <p className="text-sm font-bold text-gray-900">{selectedOrder.shipmentDetails.address}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.shipmentDetails.state}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
