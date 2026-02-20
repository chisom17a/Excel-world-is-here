import React, { useState } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [currentImage, setCurrentImage] = useState(0);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }
    if (!profile?.isActivated) {
      toast.error('Please verify your email to add to cart');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.hasDiscount && product.discountPrice ? product.discountPrice : product.price,
      quantity: 1,
      image: product.images[0],
    });
    toast.success('Added to cart');
  };

  const currentPrice = product.hasDiscount && product.discountPrice ? product.discountPrice : product.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-900 hover:bg-white transition-colors shadow-md"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="md:w-1/2 relative bg-gray-50 h-[300px] md:h-auto">
            <img
              src={product.images[currentImage]}
              alt={product.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImage === idx ? 'bg-orange-600 w-4' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl font-bold text-orange-600">{formatPrice(currentPrice)}</span>
                {product.hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed line-clamp-4">{product.description}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </button>
              
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                View Full Details
              </Link>
            </div>

            {product.limitedToStates && product.limitedToStates.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Available In</h4>
                <div className="flex flex-wrap gap-2">
                  {product.limitedToStates.map((state) => (
                    <span key={state} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-md font-medium">
                      {state}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;
