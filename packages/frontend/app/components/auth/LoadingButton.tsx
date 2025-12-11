'use client';

import React from 'react';
import { motion } from "motion/react";


interface LoadingButtonProps {
  type?: 'button' | 'submit';
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  loadingText: string;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export default function LoadingButton({
  type = 'button',
  isLoading,
  disabled,
  children,
  loadingText,
  className = 'w-full rounded-2xl bg-highlight-gradient py-4 text-white transition-colors hover:bg-purple-500 disabled:opacity-50',
  delay = 1.2,
  onClick,
}: LoadingButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={isLoading || disabled}
      className={className}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
    >
      <motion.span
        animate={isLoading ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
        transition={isLoading ? { repeat: Infinity, duration: 1 } : {}}
      >
        {isLoading ? loadingText : children}
      </motion.span>
    </motion.button>
  );
}
