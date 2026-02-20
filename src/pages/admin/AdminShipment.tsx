import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { Search, Eye, Check, X, Truck, Package, MapPin, User, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const AdminShipment = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
    return () => unsub();
  }, []);

  const handleApproveShipment = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'shipped'
      });

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        message: `Your product is on its way to ${order.shipmentDetails.address}. Contact us for more info at +2349039226769.`,
        type: 'success',
        read: false,
        createdAt: Date.now()
      });

      toast.success('Shipment approved');
    } catch (error) {
      toast.error('Error approving shipment');
    }
  };

  const handleRejectShipment = async (order: Order) => {
    if (window.confirm('Mark this shipment as delayed/rejected?')) {
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'pending_approval' // Reset or keep in pending
        });

        // Notify user
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          message: `Your product shipment has been delayed. For more information, please contact us on WhatsApp +2349039226769.`,
          type: 'warning',
          read: false,
          createdAt: Date.now()
        });

        toast.success('Shipment marked as delayed');
      } catch (error) {
        toast.error('Error rejecting shipment');
      }
    }
  };

  // Filter: Only approved (awaiting shipment) or shipped
  const shipmentOrders = orders.filter(o => o.status === 'approved' || o.status === 'shipped');
  
  // Sort: approved (awaiting) first
  const sortedOrders = shipmentOrders.sort((a, b) => {
    if (a.status === 'approved' && b.status !== 'approved') return -1;
    if (a.status !== 'approved' && b.status === 'approved') return 1;
    return b.createdAt - a.createdAt;
  });

  const filteredOrders = sortedOrders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.shipmentDetails.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shipment Management</h1>
          <p className="text-gray-500">Track and manage product deliveries.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, email or address..."
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{order.userEmail}</p>
                    <p className="text-[10px] text-gray-400">ID: #{order.id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-1 text-orange-600 font-bold text-xs hover:underline"
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {order.status === 'approved' ? 'Awaiting Shipment' : 'Shipped'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {order.status === 'approved' ? (
                        <>
                          <button 
                            onClick={() => handleApproveShipment(order)}
                            className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                            title="Approve Shipment"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectShipment(order)}
                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                            title="Delay Shipment"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="p-2 text-green-600">
                          <Truck size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
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
              className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Shipment Info</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {/* Receiver Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                      <User size={14} className="mr-2" />
                      Receiver
                    </h4>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.userEmail}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone size={12} className="mr-2" />
                        {selectedOrder.shipmentDetails.phone}
                      </div>
                      {selectedOrder.shipmentDetails.altPhone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone size={12} className="mr-2" />
                          {selectedOrder.shipmentDetails.altPhone}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail size={12} className="mr-2" />
                        {selectedOrder.shipmentDetails.altEmail || 'No alternative email'}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-orange-50 rounded-2xl">
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center">
                      <MapPin size={14} className="mr-2" />
                      Address
                    </h4>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.shipmentDetails.address}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.shipmentDetails.state}, Nigeria</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <Package size={14} className="mr-2" />
                    Products to Ship
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-2xl">
                        <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
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

export default AdminShipment;
