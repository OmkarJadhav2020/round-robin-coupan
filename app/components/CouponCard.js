'use client';
import { motion } from 'framer-motion';
import { FaTicketAlt, FaCopy, FaCheck, FaClock, FaStore } from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function CouponCard({ coupon }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Coupon code copied to clipboard!');
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Add mock expiration date for visual appeal
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <motion.div 
      className="w-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative elements */}
      <div className="absolute -left-3 top-1/2 w-6 h-12 bg-indigo-900 rounded-r-full transform -translate-y-1/2"></div>
      <div className="absolute -right-3 top-1/2 w-6 h-12 bg-indigo-900 rounded-l-full transform -translate-y-1/2"></div>
      
      {/* Main card content */}
      <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-1 rounded-2xl">
        <div className="bg-gradient-to-r from-gray-900 to-slate-900 rounded-xl overflow-hidden">
          {/* Top section with code */}
          <div className="px-6 py-4 flex flex-col items-center border-b border-white/10">
            <div className="bg-white/10 text-white px-2 py-1 rounded-full text-xs mb-2">
              PREMIUM OFFER
            </div>
            
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-indigo-300 tracking-wider">
              {coupon.code}
            </div>
          </div>
          
          {/* Description section */}
          <div className="px-6 py-5">
            <h3 className="text-white font-semibold text-lg mb-1">
              {coupon.description}
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mt-4 gap-3 text-white/60 text-sm">
              <div className="flex items-center">
                <FaClock className="mr-1.5 text-pink-400" /> 
                <span>Valid until {formattedExpiryDate}</span>
              </div>
              
              <div className="flex items-center">
                <FaStore className="mr-1.5 text-indigo-400" />
                <span>Online & In-store</span>
              </div>
            </div>
          </div>
          
          {/* Bottom action section */}
          <div className="px-6 py-4 bg-black/20 flex justify-between items-center">
            <div className="flex items-center text-xs font-medium text-white/40">
              <FaTicketAlt className="mr-1.5" />
              <span>Single-use code</span>
            </div>
            
            <motion.button
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg ${
                copied 
                  ? 'bg-green-500/30 text-green-300' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              } transition-colors text-sm font-medium`}
              onClick={copyToClipboard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <>
                  <FaCheck />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FaCopy />
                  <span>Copy Code</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}