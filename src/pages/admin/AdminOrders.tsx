import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, increment, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, Notification } from '../../types';
import { formatPrice } from '../../utils';
import { Search, Eye, Check, X, MessageCircle, Clock, Package, Truck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
    return () => unsub();
  }, []);

  const handleApprove = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'approved'
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        message: `Your order #${order.id.slice(-6).toUpperCase()} has been approved and will be delivered soon. If you have any issues, contact +2349039226769 on WhatsApp.`,
        type: 'success',
        read: false,
        createdAt: Date.now()
      });

      toast.success('Order approved');
    } catch (error) {
      toast.error('Error approving order');
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason) return;
    
    if (window.confirm('Are you sure you want to reject this order? The payment will be refunded to user cashback balance.')) {
      try {
        await updateDoc(doc(db, 'orders', selectedOrder.id), {
          status: 'rejected',
          rejectionReason
        });

        // Refund to cashback
        await updateDoc(doc(db, 'users', selectedOrder.userId), {
          cashbackBalance: increment(selectedOrder.totalAmount)
        });

        // Notify user
        await addDoc(collection(db, 'notifications'), {
          userId: selectedOrder.userId,
          message: `Your order request - #${selectedOrder.id.slice(-6).toUpperCase()} has been rejected and ${formatPrice(selectedOrder.totalAmount)} has been credited to your cashback balance. Reason: ${rejectionReason}. If you feel there was an error, contact admin at +2349039226769 on WhatsApp.`,
          type: 'error',
          read: false,
          createdAt: Date.now()
        });

        // Record transaction
        await addDoc(collection(db, 'transactions'), {
          userId: selectedOrder.userId,
          amount: selectedOrder.totalAmount,
          type: 'refund',
          description: `Refund for rejected order #${selectedOrder.id.slice(-6).toUpperCase()}`,
          createdAt: Date.now()
        });

        toast.success('Order rejected and refunded');
        setShowRejectionModal(false);
        setSelectedOrder(null);
        setRejectionReason('');
      } catch (error) {
        toast.error('Error rejecting order');
      }
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500">View and manage all customer orders.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order ID or email..."
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.userEmail}</p>
                    <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-orange-600">{formatPrice(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      order.status === 'approved' ? 'bg-green-50 text-green-600' :
                      order.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      {order.status === 'pending_approval' && (
                        <>
                          <button 
                            onClick={() => handleApprove(order)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Approve"
                          >
                            <Check size={20} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowRejectionModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Reject"
                          >
                            <X size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && !showRejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                    <p className="text-sm font-bold text-orange-600 uppercase">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Items Ordered</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-2xl">
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.price)}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-orange-50 rounded-2xl">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Shipment Address</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.shipmentDetails.address}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shipmentDetails.state}, Nigeria</p>
                    <p className="text-sm text-gray-600">Phone: {selectedOrder.shipmentDetails.phone}</p>
                  </div>
                </div>

                {selectedOrder.paymentProof && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Proof</h4>
                    <div className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">Sender Name</p>
                        <p className="text-sm font-bold text-gray-900">{selectedOrder.paymentProof.senderName}</p>
                      </div>
                      {selectedOrder.paymentProof.imageUrl && (
                        <a 
                          href={selectedOrder.paymentProof.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectionModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900 mb-4">Reject Order</h3>
              <p className="text-gray-500 text-sm mb-6">Please provide a reason for rejecting this order. The user will be notified and refunded.</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Payment not received, Out of stock..."
                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-500 mb-6"
                rows={4}
              />

              <div className="flex space-x-4">
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
