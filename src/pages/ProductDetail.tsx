import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Share2, ChevronLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          toast.error('Product not found');
          navigate('/');
        }
        setLoading(false);
      };
      fetchProduct();
    }
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-orange-600 mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100"
            >
              <img
                src={product.images[currentImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    currentImage === idx ? 'border-orange-600' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-black text-orange-600">{formatPrice(currentPrice)}</span>
                {product.hasDiscount && (
                  <div className="flex flex-col">
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      SAVE {formatPrice(product.price - (product.discountPrice || 0))}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center"><Truck size={18} className="mr-2 text-green-500" /> Free Shipping</div>
                <div className="flex items-center"><ShieldCheck size={18} className="mr-2 text-blue-500" /> 1 Year Warranty</div>
              </div>
            </div>

            <div className="prose prose-orange max-w-none mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {product.fullDetails && (
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Specifications</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.fullDetails}</p>
              </div>
            )}

            <div className="mt-auto space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20"
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>
                <button className="p-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-colors">
                  <Heart size={24} />
                </button>
                <button className="p-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-colors">
                  <Share2 size={24} />
                </button>
              </div>
            </div>

            {product.externalLinks && product.externalLinks.length > 0 && (
              <div className="mt-8">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">External Links</h4>
                <div className="flex flex-wrap gap-2">
                  {product.externalLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:underline flex items-center"
                    >
                      Resource {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
