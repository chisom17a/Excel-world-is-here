import React, { useState } from 'react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative"
      onClick={() => onQuickView(product)}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {product.hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)}%
          </div>
        )}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 flex items-center justify-center space-x-2"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="p-3 bg-white rounded-full text-gray-900 hover:bg-orange-600 hover:text-white transition-colors shadow-lg"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={handleAddToCart}
                className="p-3 bg-white rounded-full text-gray-900 hover:bg-orange-600 hover:text-white transition-colors shadow-lg"
              >
                <ShoppingCart size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-orange-600">{formatPrice(currentPrice)}</span>
          {product.hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="mt-2 flex items-center text-[10px] text-gray-400">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">Free Shipping</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
