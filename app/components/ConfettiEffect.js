'use client';
import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

export default function ConfettiEffect() {
  const [windowDimension, setWindowDimension] = useState({ 
    width: undefined, 
    height: undefined 
  });
  const [showConfetti, setShowConfetti] = useState(true);
  const [confettiProps, setConfettiProps] = useState({
    recycle: true,
    numberOfPieces: 200,
    gravity: 0.1,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial setup
    handleResize();
    window.addEventListener('resize', handleResize);

    // Start with more intense confetti
    setConfettiProps({
      recycle: true,
      numberOfPieces: 500,
      gravity: 0.1,
    });

    // After 2 seconds, reduce intensity
    const reduceTimeout = setTimeout(() => {
      setConfettiProps({
        recycle: true,
        numberOfPieces: 150,
        gravity: 0.15,
      });
    }, 2000);

    // After 5 seconds total, stop recycling and let remaining confetti fall
    const stopRecycleTimeout = setTimeout(() => {
      setConfettiProps(prev => ({
        ...prev,
        recycle: false,
        numberOfPieces: 50,
      }));
    }, 5000);

    // After 8 seconds total, completely remove confetti
    const hideTimeout = setTimeout(() => {
      setShowConfetti(false);
    }, 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(reduceTimeout);
      clearTimeout(stopRecycleTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (!showConfetti) return null;

  return (
    <ReactConfetti
      width={windowDimension.width}
      height={windowDimension.height}
      recycle={confettiProps.recycle}
      numberOfPieces={confettiProps.numberOfPieces}
      gravity={confettiProps.gravity}
      colors={[
        '#ec4899', // pink-500
        '#6366f1', // indigo-500
        '#a855f7', // purple-500
        '#f43f5e', // rose-500
        '#ffffff', // white
      ]}
      confettiSource={{
        x: windowDimension.width / 2,
        y: windowDimension.height / 3,
        w: 0,
        h: 0,
      }}
    />
  );
}