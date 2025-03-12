'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaHourglassHalf, FaExclamationCircle } from 'react-icons/fa';

export default function CountdownTimer({ nextEligibleTime }) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(100);
  const [initialDuration, setInitialDuration] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const eligibleTime = new Date(nextEligibleTime);
      const difference = eligibleTime - now;
      
      if (difference <= 0) {
        return { minutes: 0, seconds: 0 };
      }
      
      return {
        minutes: Math.floor(difference / (1000 * 60)),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Calculate initial duration in seconds for progress bar
    const initialTimeLeft = calculateTimeLeft();
    const totalSeconds = initialTimeLeft.minutes * 60 + initialTimeLeft.seconds;
    setInitialDuration(totalSeconds);
    setTimeLeft(initialTimeLeft);
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Calculate progress percentage for progress bar
      const remainingSeconds = newTimeLeft.minutes * 60 + newTimeLeft.seconds;
      const progressPercentage = (remainingSeconds / totalSeconds) * 100;
      setProgress(progressPercentage);
      
      if (newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer);
        window.location.reload(); // Refresh when timer ends
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextEligibleTime]);

  // Format with leading zeros
  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-indigo-500/20 px-4 py-2 rounded-full flex items-center border border-indigo-500/30"
      >
        <FaExclamationCircle className="text-indigo-300 mr-2" />
        <span className="text-black font-medium">Waiting Period</span>
      </motion.div>
      
      <h2 className="text-2xl font-bold text-black text-center">
        Your next coupon will be available soon
      </h2>
      
      <div className="flex flex-col items-center w-full max-w-xs">
        <div className="relative w-full h-40 flex items-center justify-center mb-6">
          {/* Background circle */}
          <svg className="w-full h-full absolute" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 1 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              transform="rotate(-90 50 50)"
              strokeDasharray="283"
              strokeDashoffset="0"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer text */}
          <div className="z-10 flex flex-col items-center">
            <div className="text-5xl font-bold text-black tracking-wide">
              {formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
            </div>
            <div className="text-pink-300/80 text-sm mt-1">remaining</div>
          </div>
        </div>
        
        <div className="flex items-center text-black/60 mb-2 text-sm">
          <FaClock className="mr-2" />
          <span>Please wait before claiming another coupon</span>
        </div>
        
        <p className="text-black/50 text-sm text-center">
          Our system allows one coupon per user within a timeframe to ensure fair distribution.
        </p>
      </div>
    </div>
  );
}