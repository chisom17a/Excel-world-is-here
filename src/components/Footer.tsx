import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, MessageCircle, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Social Icons */}
          <div className="flex space-x-6">
            <a
              href="https://twitter.com/favour15563"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Twitter size={24} />
            </a>
            <a
              href="https://wa.me/2349039226769"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-500 transition-colors"
            >
              <MessageCircle size={24} />
            </a>
            <a
              href="https://chisomstudio.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Globe size={24} />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full text-center md:text-left">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Shop</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-gray-600 hover:text-orange-600">All Products</Link></li>
                <li><Link to="/" className="text-sm text-gray-600 hover:text-orange-600">New Arrivals</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-sm text-gray-600 hover:text-orange-600">Terms & Conditions</Link></li>
                <li><a href="https://wa.me/2349039226769" className="text-sm text-gray-600 hover:text-orange-600">Contact Us</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-2 flex flex-col items-center md:items-end">
              <span className="text-2xl font-bold text-orange-600 tracking-tighter">chistore</span>
              <p className="text-sm text-gray-500 mt-2">Your one-stop shop for everything.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 w-full text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} chistore. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Built by{' '}
              <a
                href="https://chisomstudio.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                chiboydatabase
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
