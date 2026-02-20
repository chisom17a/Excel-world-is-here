import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Transaction } from '../types';
import { formatPrice } from '../utils';
import { motion } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCcw, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase': return <ArrowUpRight className="text-red-500" size={20} />;
      case 'cashback_credit': return <ArrowDownLeft className="text-green-500" size={20} />;
      case 'refund': return <RefreshCcw className="text-blue-500" size={20} />;
      default: return <Wallet size={20} />;
    }
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

        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Transaction History</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${
                      tx.type === 'purchase' ? 'bg-red-50' : 
                      tx.type === 'cashback_credit' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      {getIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${
                      tx.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'purchase' ? '-' : '+'}{formatPrice(tx.amount)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.type.replace('_', ' ')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Wallet size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
