import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { NIGERIAN_STATES, ShipmentDetails } from '../types';
import { formatPrice } from '../utils';
import { ChevronLeft, ArrowRight, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [details, setDetails] = useState<ShipmentDetails>({
    email: profile?.email || '',
    altEmail: '',
    phone: '',
    altPhone: '',
    state: '',
    address: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cashback' | 'direct' | 'mixed'>('direct');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleProceed = () => {
    if (!details.phone || !details.state || !details.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate cashback if selected
    if (paymentMethod === 'cashback') {
      const balance = profile?.cashbackBalance || 0;
      if (balance < total) {
        const needed = total - balance;
        toast((t) => (
          <span>
            Insufficient cashback balance. You need {formatPrice(needed)} more.{' '}
            <button
              onClick={() => {
                setPaymentMethod('mixed');
                toast.dismiss(t.id);
              }}
              className="font-bold text-orange-600"
            >
              Switch to Mixed Payment?
            </button>
          </span>
        ), { duration: 6000 });
        return;
      }
    }

    setIsConfirming(true);
  };

  const handleFinalConfirm = () => {
    // Save details to session/state and move to payment
    sessionStorage.setItem('checkout_details', JSON.stringify({
      details,
      paymentMethod,
      total
    }));
    navigate('/payment');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All items in cart will be cleared.')) {
      clearCart();
      navigate('/');
    }
  };

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-black text-gray-900 mb-6">Confirm Order Details</h2>
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Shipment Info</p>
                <p className="text-sm font-medium text-gray-900">{details.address}</p>
                <p className="text-sm text-gray-600">{details.state}, Nigeria</p>
                <p className="text-sm text-gray-600">{details.phone}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Summary</p>
                <p className="text-sm text-gray-600">Method: <span className="font-bold text-orange-600 uppercase">{paymentMethod}</span></p>
                <p className="text-lg font-black text-gray-900 mt-2">{formatPrice(total)}</p>
              </div>
            </div>
            <div className="p-4 border border-orange-100 bg-orange-50 rounded-2xl text-orange-800 text-sm">
              Please confirm your details carefully. After payment, shipment information cannot be changed.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleFinalConfirm}
              className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
            >
              Confirm & Pay
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Edit Details
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shipment Details</h1>
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-orange-600 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium">Back to Cart</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Contact Info */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-4">
                <Mail size={20} />
                <h3 className="font-bold">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Alternative Email (Optional)</label>
                  <input
                    type="email"
                    value={details.altEmail}
                    onChange={(e) => setDetails({ ...details, altEmail: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                    placeholder="09039226769"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Alternative Phone (Optional)</label>
                  <input
                    type="tel"
                    value={details.altPhone}
                    onChange={(e) => setDetails({ ...details, altPhone: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-4">
                <MapPin size={20} />
                <h3 className="font-bold">Shipping Address</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">State</label>
                  <select
                    required
                    value={details.state}
                    onChange={(e) => setDetails({ ...details, state: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Full Address (Include Landmarks)</label>
                  <textarea
                    required
                    rows={3}
                    value={details.address}
                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                    placeholder="House number, Street name, Landmark..."
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-4">
                <CreditCard size={20} />
                <h3 className="font-bold">Payment Method</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'cashback', label: 'Cashback Only', desc: `Bal: ${formatPrice(profile?.cashbackBalance || 0)}` },
                  { id: 'direct', label: 'Direct Payment', desc: 'Bank Transfer' },
                  { id: 'mixed', label: 'Mixed Payment', desc: 'Cashback + Transfer' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      paymentMethod === m.id 
                        ? 'border-orange-600 bg-orange-50' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className="font-bold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <button
              onClick={handleCancel}
              className="text-red-500 font-bold hover:underline"
            >
              Cancel Order
            </button>
            <div className="flex items-center space-x-6 w-full sm:w-auto">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Total Amount</p>
                <p className="text-2xl font-black text-orange-600">{formatPrice(total)}</p>
              </div>
              <button
                onClick={handleProceed}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20"
              >
                <span>Proceed</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
