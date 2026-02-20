import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, NIGERIAN_STATES } from '../../types';
import { formatPrice, uploadToImgBB, cn } from '../../utils';
import { Plus, Search, Eye, Edit, Trash2, X, Upload, Check, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    images: [],
    price: 0,
    discountPrice: 0,
    hasDiscount: false,
    fullDetails: '',
    externalLinks: [],
    limitedToStates: []
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    toast.loading('Uploading images...', { id: 'upload' });
    try {
      const newImages = [...(formData.images || [])];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToImgBB(files[i]);
        newImages.push(url);
      }
      setFormData({ ...formData, images: newImages });
      toast.success('Images uploaded', { id: 'upload' });
    } catch (error) {
      toast.error('Upload failed', { id: 'upload' });
    }
  };

  const removeImage = (idx: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(idx, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || formData.images?.length === 0) {
      toast.error('Please fill in required fields (Name, Price, at least 1 Image)');
      return;
    }
    setIsConfirming(true);
  };

  const finalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        createdAt: editingProduct ? editingProduct.createdAt : Date.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success('Product added');
      }
      
      closeModal();
    } catch (error) {
      toast.error('Error saving product');
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted');
      } catch (error) {
        toast.error('Error deleting product');
      }
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setIsConfirming(false);
    setFormData({
      name: '',
      description: '',
      images: [],
      price: 0,
      discountPrice: 0,
      hasDiscount: false,
      fullDetails: '',
      externalLinks: [],
      limitedToStates: []
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500">Manage your store inventory.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-gray-100 rounded-2xl py-3 pl-12 pr-4 w-full md:w-64 focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 text-white p-3 rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{formatPrice(product.price)}</p>
                    {product.hasDiscount && (
                      <p className="text-[10px] text-red-500 font-bold">Disc: {formatPrice(product.discountPrice || 0)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openEdit(product)}
                        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">
                  {isConfirming ? 'Confirm Product Details' : editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                {!isConfirming ? (
                  <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Product Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                          placeholder="e.g., Wireless Headphones"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Price (₦)</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                        rows={3}
                      />
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-gray-700">Images</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {formData.images?.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                          <Plus className="text-gray-400" size={24} />
                          <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Add</span>
                          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="flex items-center space-x-8 p-6 bg-gray-50 rounded-2xl">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasDiscount}
                          onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                          className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-bold text-gray-700">Has Discount?</span>
                      </label>
                      {formData.hasDiscount && (
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold text-gray-500">Discount Price (₦)</label>
                          <input
                            type="number"
                            value={formData.discountPrice}
                            onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                            className="w-full bg-white border-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Full Specifications</label>
                      <textarea
                        value={formData.fullDetails}
                        onChange={(e) => setFormData({ ...formData, fullDetails: e.target.value })}
                        className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                        rows={5}
                        placeholder="Detailed features, dimensions, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Limited to States (Optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {NIGERIAN_STATES.map(state => (
                          <button
                            key={state}
                            onClick={() => {
                              const current = formData.limitedToStates || [];
                              const next = current.includes(state) 
                                ? current.filter(s => s !== state) 
                                : [...current, state];
                              setFormData({ ...formData, limitedToStates: next });
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                              formData.limitedToStates?.includes(state)
                                ? "bg-orange-600 text-white border-orange-600"
                                : "bg-white text-gray-500 border-gray-200 hover:border-orange-500"
                            )}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20"
                    >
                      Proceed to Confirm
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
                        <img src={formData.images?.[0]} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900">{formData.name}</h3>
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl font-black text-orange-600">
                            {formatPrice(formData.hasDiscount ? formData.discountPrice! : formData.price!)}
                          </span>
                          {formData.hasDiscount && (
                            <span className="text-lg text-gray-400 line-through">{formatPrice(formData.price!)}</span>
                          )}
                        </div>
                        <p className="text-gray-600">{formData.description}</p>
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Availability</p>
                          <p className="text-sm text-gray-700">
                            {formData.limitedToStates?.length ? `Limited to ${formData.limitedToStates.length} states` : 'Available Nationwide'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={finalSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
                        <span>{editingProduct ? 'Update Product' : 'Post Product'}</span>
                      </button>
                      <button
                        onClick={() => setIsConfirming(false)}
                        className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Back to Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
