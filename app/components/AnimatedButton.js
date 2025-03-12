'use client';
import { motion } from 'framer-motion';

export default function AnimatedButton({ onClick, disabled, children, className = '', variant = 'primary' }) {
  // Button variants
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white',
    secondary: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white',
    outline: 'bg-transparent border-2 border-white/20 hover:bg-white/10 text-white',
  };
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-full py-3 px-6 font-medium text-lg transition-all duration-200 ${variants[variant]} ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17,
        duration: 0.3 
      }}
    >
      {/* Glow effect */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20"></span>
      
      {/* Button content */}
      <span className="relative flex items-center justify-center">
        {children}
      </span>
    </motion.button>
  );
}