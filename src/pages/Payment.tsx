import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { formatPrice, uploadToImgBB } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Upload, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Payment = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('checkout_details');
    if (!data || items.length === 0) {
      navigate('/cart');
      return;
    }
    setCheckoutData(JSON.parse(data));
  }, [items, navigate]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSent = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowProofUpload(true);
    }, 3000);
  };

  const handleSubmitProof = async () => {
    if (!senderName) {
      toast.error('Please enter sender name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (proofImage) {
        imageUrl = await uploadToImgBB(proofImage);
      }

      const orderData = {
        userId: user?.uid,
        userEmail: user?.email,
        items,
        totalAmount: total,
        status: 'pending_approval',
        paymentMethod: checkoutData.paymentMethod,
        shipmentDetails: checkoutData.details,
        paymentProof: {
          senderName,
          imageUrl,
          timestamp: Date.now()
        },
        createdAt: Date.now()
      };

      // Create order
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: user?.uid,
        amount: total,
        type: 'purchase',
        description: `Order #${orderRef.id.slice(-6)}`,
        createdAt: Date.now()
      });

      // If cashback was used, deduct it
      if (checkoutData.paymentMethod === 'cashback' || checkoutData.paymentMethod === 'mixed') {
        const amountToDeduct = checkoutData.paymentMethod === 'cashback' 
          ? total 
          : Math.min(profile?.cashbackBalance || 0, total);
        
        await updateDoc(doc(db, 'users', user!.uid), {
          cashbackBalance: increment(-amountToDeduct)
        });
      }

      toast.success('Order placed successfully! Admin will verify your payment.');
      sessionStorage.removeItem('checkout_details');
      clearCart();
      navigate('/');
    } catch (error) {
      toast.error('Error submitting proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!checkoutData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {isVerifying ? (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-12 shadow-xl text-center"
            >
              <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">Verifying Payment</h2>
              <p className="text-gray-500">Proceeding to secure payment gateway...</p>
            </motion.div>
          ) : !showProofUpload ? (
            <motion.div
              key="bank-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
            >
              <div className="bg-orange-600 p-8 text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheck size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Secure Payment</span>
                </div>
                <h2 className="text-3xl font-black">Bank Transfer</h2>
                <p className="text-orange-100 mt-2">Please make a transfer to the account below</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</p>
                      <p className="text-lg font-bold text-gray-900">Opay</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Account Number</p>
                      <p className="text-2xl font-black text-gray-900 tracking-wider">9162141283</p>
                    </div>
                    <button
                      onClick={() => handleCopy('9162141283', 'acc')}
                      className="p-3 bg-white rounded-xl text-orange-600 shadow-sm hover:bg-orange-50 transition-colors"
                    >
                      {copied === 'acc' ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Account Name</p>
                    <p className="text-lg font-bold text-gray-900">Chisom Nnonyelu Favour</p>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-orange-400 uppercase">Amount to Pay</p>
                      <p className="text-2xl font-black text-orange-600">{formatPrice(total)}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(total.toString(), 'amount')}
                      className="p-3 bg-white rounded-xl text-orange-600 shadow-sm hover:bg-orange-50 transition-colors"
                    >
                      {copied === 'amount' ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleSent}
                    className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20"
                  >
                    I've Sent It
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="proof-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6">Upload Payment Proof</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Sender's Name</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter the name on the bank account"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Proof Image (Optional but recommended)</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">
                        {proofImage ? proofImage.name : 'Click or drag to upload receipt'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitProof}
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Proof</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Payment;
