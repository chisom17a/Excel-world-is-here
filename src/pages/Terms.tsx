import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-orange-600 mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
              <Shield size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Terms & Conditions</h1>
          </div>

          <div className="prose prose-orange max-w-none text-gray-600 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using chistore, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                2. User Registration
              </h2>
              <p>
                Users must provide accurate information during registration. Accounts must be verified via email to access full features like adding to cart and placing orders.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                3. Orders and Payments
              </h2>
              <p>
                All orders are subject to availability and confirmation of the order price. Payment must be made through our approved channels (Cashback, Direct Bank Transfer, or Mixed). Proof of payment must be uploaded for verification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                4. Shipping and Delivery
              </h2>
              <p>
                Delivery times may vary based on location. We are not responsible for delays outside of our control. Users will be notified of shipment status through their profile notifications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                5. Refunds and Cashback
              </h2>
              <p>
                Rejected orders will have their total amount credited back to the user's cashback balance. This balance can be used for future purchases but cannot be withdrawn as cash.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <FileText size={20} className="mr-2 text-orange-600" />
                6. Contact Information
              </h2>
              <p>
                For any issues or inquiries, please contact us on WhatsApp at +2349039226769.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 italic">Last updated: February 20, 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
