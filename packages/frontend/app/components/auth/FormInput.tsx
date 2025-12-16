'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FormInputProps {
  id: string;
  name: string;
  type: 'text' | 'email' | 'password';
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  delay?: number;
  icon?: React.ReactNode;
}

export default function FormInput({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
  delay = 0.9,
  icon,
}: FormInputProps) {
  const defaultIcon = (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {type === 'password' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      ) : type === 'email' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      )}
    </svg>
  );

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <motion.label
        htmlFor={id}
        className="mb-2 block text-white"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.05, duration: 0.3 }}
      >
        {label}
      </motion.label>
      <motion.div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.3 }}
          className="absolute left-3 top-1/3 transform -translate-y-1/2 text-gray-400"
        >
          {icon || defaultIcon}
        </motion.div>
        <motion.input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg bg-gray-800/50 py-3 pl-12 pr-4 text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
            error
              ? 'border border-red-500 focus:ring-red-500'
              : 'focus:ring-purple-500'
          }`}
          whileFocus={{ scale: 1.02 }}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-1 text-sm text-red-400"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
