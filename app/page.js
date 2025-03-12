'use client';

import { useState, useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTicketAlt, FaSpinner, FaInfoCircle, FaGift, FaArrowRight } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import our components
import CouponCard from './components/CouponCard';
import CountdownTimer from './components/CountdownTimer';
import AnimatedButton from './components/AnimatedButton';
import ConfettiEffect from './components/ConfettiEffect';

export default function Home() {
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldownTime, setCooldownTime] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check for existing cookie on page load
  useEffect(() => {
    setMounted(true);
    const checkPreviousClaim = async () => {
      const browserId = getCookie('browser_id');
      if (browserId) {
        try {
          const response = await fetch('/api/check-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ browserId }),
          });
          
          const data = await response.json();
          if (data.cooldown) {
            setCooldownTime(data.nextEligibleTime);
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
      }
    };
    
    checkPreviousClaim();
  }, []);

  const claimCoupon = async () => {
    setLoading(true);
    setError(null);
    setCoupon(null);
    
    try {
      // Get browser ID from cookie if it exists
      const browserId = getCookie('browser_id');
      
      const response = await fetch('/api/claim-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          browserId: browserId
        }),
      });
      
      const data = await response.json();
      
      // Check if the request was successful
      if (!response.ok) {
        console.error('Error response:', data);
        toast.error(data.message || 'Failed to claim coupon');
        setError(data.message || 'Failed to claim coupon');
        if (data.nextEligibleTime) {
          setCooldownTime(data.nextEligibleTime);
        }
        return;
      }
      
      // If we got a browser ID back, save it in a cookie
      if (data.browserId) {
        try {
          setCookie('browser_id', data.browserId, { 
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
            sameSite: 'strict'
          });
        } catch (cookieError) {
          console.error('Error setting cookie:', cookieError);
          // Continue anyway, this isn't fatal
        }
      }
      
      // If we have a coupon, display it
      if (data.coupon) {
        setCoupon(data.coupon);
        setCooldownTime(null);
        setShowSuccess(true);
        toast.success('Coupon claimed successfully!');
      } else {
        setError('No coupon received from server');
        toast.error('No coupon received from server');
      }
    } catch (err) {
      console.error('Error claiming coupon:', err);
      setError('An unexpected error occurred. Please try again later.');
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null; // Prevent flash of unstyled content
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-black">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {/* Animated background shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[blob_7s_infinite]"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[blob_7s_infinite] animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[blob_7s_infinite] animation-delay-4000"></div>
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMCAwIEw2MCAwIEw2MCA2MCBMMCAwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')] opacity-10"></div>
      </div>
      
      {showSuccess && <ConfettiEffect />}
      
      <ToastContainer 
        position="top-center" 
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Main content container with glassmorphism effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl p-6 md:p-10"
      >
        {/* Logo and header section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-10"
        >
          <motion.div 
            className="inline-flex items-center justify-center mb-6 relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-indigo-600 shadow-lg shadow-pink-500/20">
              <FaTicketAlt className="text-2xl text-black" />
            </div>
          </motion.div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
            Premium Coupons
          </h1>
          
          <p className="text-xl text-pink-100/80 max-w-xl mx-auto">
            Unlock exclusive deals with our limited-time offers
          </p>
        </motion.div>

        {/* Main card section */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
          {/* Left column - Content explanation */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full md:w-2/5 flex flex-col"
          >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border border-white/10 rounded-3xl p-6 flex-grow flex flex-col">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <span className="h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center mr-2">
                  <FaGift className="text-black text-sm" />
                </span>
                How It Works
              </h2>
              
              <div className="space-y-5 flex-grow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold text-black text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black text-lg">Claim Your Offer</h3>
                    <p className="text-black/70">Click the button to receive an exclusive coupon code.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold text-black text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black text-lg">Use at Checkout</h3>
                    <p className="text-black/70">Enter your unique code during checkout to apply your discount.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-pink-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold text-black text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black text-lg">Enjoy the Savings</h3>
                    <p className="text-black/70">Receive your discount and enjoy premium products for less.</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-black/50 mt-6 italic">
                Our system distributes coupons in a fair, round-robin manner. Each user is limited to one coupon within the specified timeframe.
              </p>
            </div>
          </motion.div>
          
          {/* Right column - Coupon display or claim button */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full md:w-3/5"
          >
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border border-white/10 rounded-3xl p-8 h-full">
              {/* Different content based on state */}
              <AnimatePresence mode="wait">
                {coupon ? (
                  <motion.div
                    key="coupon-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-green-500/20"
                    >
                      <span className="text-3xl">🎉</span>
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-black mb-2">Congratulations!</h2>
                    <p className="text-pink-100/80 mb-8 text-lg">
                      You've unlocked this exclusive offer:
                    </p>
                    
                    <CouponCard coupon={coupon} />
                    
                    <p className="text-sm text-black/60 italic mt-6 max-w-sm">
                      Remember to use this code at checkout before it expires. This offer is exclusively for you!
                    </p>
                  </motion.div>
                ) : cooldownTime ? (
                  <motion.div
                    key="coupon-cooldown"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                  >
                    <CountdownTimer nextEligibleTime={cooldownTime} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="coupon-claim"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center h-full justify-center"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -15, 0],
                        rotateZ: [0, 5, 0, -5, 0]
                      }}
                      transition={{ 
                        duration: 5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative mb-8"
                    >
                      <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 blur-xl scale-110"></div>
                      <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <FaTicketAlt className="text-4xl text-black" />
                      </div>
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-black mb-3">Claim Your Exclusive Offer</h2>
                    <p className="text-pink-100/80 mb-8 text-lg max-w-md">
                      Unlock special discounts available only through our premium coupon system.
                    </p>
                    
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <button
                        onClick={claimCoupon}
                        disabled={loading}
                        className={`relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-black bg-gradient-to-r from-pink-500 to-indigo-600 rounded-full group ${loading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
                        <span className="relative flex items-center justify-center text-lg font-semibold">
                          {loading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Get Your Premium Coupon
                              <FaArrowRight className="ml-2" />
                            </>
                          )}
                        </span>
                      </button>
                    </motion.div>
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-red-300 flex items-center p-3 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30"
                      >
                        <FaInfoCircle className="mr-2 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
        
        {/* Footer section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-black/40 text-sm">
            © {new Date().getFullYear()} Premium Coupon System. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}