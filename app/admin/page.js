'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  FaPlus, FaSpinner, FaInfoCircle, FaEdit, FaTicketAlt, 
  FaPowerOff, FaTrash, FaSearch, FaChartLine, FaCheck,
  FaTimes, FaTag, FaArrowLeft, FaUser, FaCalendarAlt
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

export default function Admin() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCoupon, setNewCoupon] = useState({ code: '', description: '' });
  const [stats, setStats] = useState({ totalCoupons: 0, activeCoupons: 0, claimsToday: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active', 'inactive', 'all'

  useEffect(() => {
    fetchCoupons();
    fetchStats();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('id', { ascending: false });
        
      if (error) throw error;
      
      setCoupons(data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Failed to load coupons');
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total coupons
      const { count: totalCoupons, error: countError } = await supabase
        .from('coupons')
        .select('*', { count: 'exact' });
      
      // Get active coupons
      const { count: activeCoupons, error: activeError } = await supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .eq('is_active', true);
      
      // Get claims today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: claimsToday, error: claimsError } = await supabase
        .from('claims')
        .select('*', { count: 'exact' })
        .gte('claimed_at', today.toISOString());
        
      if (countError || activeError || claimsError) throw new Error('Failed to fetch stats');
      
      setStats({
        totalCoupons: totalCoupons || 0,
        activeCoupons: activeCoupons || 0,
        claimsToday: claimsToday || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      toast.error('Failed to load statistics');
    }
  };

  const addCoupon = async () => {
    try {
      if (!newCoupon.code || !newCoupon.description) {
        setError('Please provide both code and description');
        toast.error('Please provide both code and description');
        return;
      }
      
      // Format the coupon code: uppercase with no spaces
      const formattedCode = newCoupon.code.toUpperCase().replace(/\s+/g, '');
      
      const { error } = await supabase
        .from('coupons')
        .insert([{ 
          code: formattedCode,
          description: newCoupon.description,
          is_active: true
        }]);
        
      if (error) throw error;
      
      setNewCoupon({ code: '', description: '' });
      fetchCoupons();
      fetchStats();
      toast.success('Coupon added successfully!');
    } catch (err) {
      console.error('Error adding coupon:', err);
      setError(err.message || 'Failed to add coupon');
      toast.error(err.message || 'Failed to add coupon');
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      fetchCoupons();
      fetchStats();
      toast.success(`Coupon ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      toast.error('Failed to update coupon');
    }
  };

  const deleteCoupon = async (id) => {
    try {
      setIsDeleting(true);
      
      // First check if there are any claims for this coupon
      const { count, error: countError } = await supabase
        .from('claims')
        .select('*', { count: 'exact' })
        .eq('coupon_id', id);
        
      if (countError) throw countError;
      
      if (count > 0) {
        // If there are claims, we should probably just deactivate rather than delete
        const { error } = await supabase
          .from('coupons')
          .update({ is_active: false })
          .eq('id', id);
          
        if (error) throw error;
        
        toast.info('Coupon has been claimed by users. It has been deactivated instead of deleted.');
      } else {
        // If no claims, safe to delete
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Coupon deleted successfully!');
      }
      
      fetchCoupons();
      fetchStats();
      setSelectedCoupon(null);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter coupons based on search term and view mode
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'all') return matchesSearch;
    if (viewMode === 'active') return matchesSearch && coupon.is_active;
    if (viewMode === 'inactive') return matchesSearch && !coupon.is_active;
    
    return matchesSearch;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      {/* Navbar */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FaTicketAlt className="text-2xl text-black mr-2" />
              <h1 className="text-xl font-bold text-gray-800">Coupon Admin</h1>
            </div>
            
            <Link href="/" className="flex items-center text-gray-600 hover:text-black transition-colors">
              <FaArrowLeft className="mr-1" />
              <span>Back to Front</span>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r text-black sm:text-4xl tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-xl text-gray-500 max-w-2xl mx-auto">
            Manage your coupons and monitor distribution
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-soft p-6 flex items-center border border-gray-100"
          >
            <div className="rounded-full bg-primary-100 p-4 mr-4">
              <FaTicketAlt className="text-xl text-black" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Total Coupons</h2>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCoupons}</p>
            </div>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-soft p-6 flex items-center border border-gray-100"
          >
            <div className="rounded-full bg-green-100 p-4 mr-4">
              <FaPowerOff className="text-xl text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Active Coupons</h2>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCoupons}</p>
            </div>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-soft p-6 flex items-center border border-gray-100 sm:col-span-2 lg:col-span-1"
          >
            <div className="rounded-full bg-secondary-100 p-4 mr-4">
              <FaUser className="text-xl text-secondary-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Claims Today</h2>
              <p className="text-3xl font-bold text-gray-900">{stats.claimsToday}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Coupon Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r text-black px-6 py-4 border-b border-primary-200">
                <h2 className="text-lg font-bold text-black flex items-center">
                  <FaPlus className="mr-2 text-black" />
                  Add New Coupon
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="couponCode"
                        placeholder="e.g. SUMMER25"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                      <FaTag className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="couponDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="couponDescription"
                      placeholder="e.g. 25% off summer collection"
                      value={newCoupon.description}
                      onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  
                  <motion.button 
                    onClick={addCoupon}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r text-black  rounded-lg py-2 font-semibold shadow-sm flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Coupon
                  </motion.button>
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 flex items-center text-sm bg-red-50 p-3 rounded-lg"
                    >
                      <FaInfoCircle className="mr-2 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Instructions Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100 mt-6"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                <h2 className="text-lg font-bold text-blue-800 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-600" />
                  Quick Guide
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 text-gray-600">
                  <p className="flex items-start">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                    <span>Create coupons with unique codes and clear descriptions</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                    <span>Coupons are distributed in a round-robin fashion</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                    <span>Users are limited to one coupon within the cooldown period</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                    <span>You can activate or deactivate coupons as needed</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Coupons Table */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r text-black px-6 py-4 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 sm:mb-0 flex items-center">
                    <FaTicketAlt className="mr-2 text-black" />
                    Manage Coupons
                  </h2>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Search coupons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {/* Filter tabs */}
                <div className="flex mt-4 border-b border-gray-200">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 text-sm font-medium mr-2 ${
                      viewMode === 'all' 
                        ? 'text-black border-b-2 border-primary-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    All Coupons
                  </button>
                  <button
                    onClick={() => setViewMode('active')}
                    className={`px-4 py-2 text-sm font-medium mr-2 ${
                      viewMode === 'active' 
                        ? 'text-green-600 border-b-2 border-green-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setViewMode('inactive')}
                    className={`px-4 py-2 text-sm font-medium ${
                      viewMode === 'inactive' 
                        ? 'text-red-600 border-b-2 border-red-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <FaSpinner className="animate-spin text-4xl text-black" />
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <FaTicketAlt className="text-3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm 
                      ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                      : viewMode !== 'all'
                        ? `There are no ${viewMode} coupons yet.`
                        : 'Get started by adding your first coupon using the form.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCoupons.map((coupon) => (
                        <motion.tr 
                          key={coupon.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-primary-100 p-2 rounded-lg mr-2">
                                <FaTag className="text-black text-sm" />
                              </div>
                              <span className="font-medium text-black">{coupon.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500 max-w-xs truncate">
                              {coupon.description}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              coupon.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {coupon.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {coupon.last_assigned_at ? (
                              <div className="flex items-center">
                                <FaCalendarAlt className="text-gray-400 mr-1" />
                                {new Date(coupon.last_assigned_at).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Never</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2 flex justify-end">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                              className={`px-3 py-1 rounded-md text-white ${
                                coupon.is_active 
                                  ? 'bg-amber-500 hover:bg-amber-600' 
                                  : 'bg-green-500 hover:bg-green-600'
                              } transition-colors`}
                            >
                              {coupon.is_active ? (
                                <span className="flex items-center">
                                  <FaTimes className="mr-1" />
                                  Deactivate
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <FaCheck className="mr-1" />
                                  Activate
                                </span>
                              )}
                            </button>
                            
                            <button
                              onClick={() => setSelectedCoupon(coupon)}
                              className="px-3 py-1 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center"
                            >
                              <FaTrash className="mr-1" />
                              Delete
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-5">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              <p className="text-gray-500 mt-2">
                Are you sure you want to delete the coupon <span className="font-semibold">{selectedCoupon.code}</span>? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <motion.button
                onClick={() => setSelectedCoupon(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex-1"
                disabled={isDeleting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={() => deleteCoupon(selectedCoupon.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex-1"
                disabled={isDeleting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Coupon Distribution System Admin Panel</p>
        <p className="mt-1">© {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
}