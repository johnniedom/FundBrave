"use client";

import React from "react";
import { motion } from "motion/react";

interface AuthDividerProps {
  text: string;
  delay?: number;
}

export default function AuthDivider({ text, delay = 0.8 }: AuthDividerProps) {
  return (
    <motion.div
      className="mb-6 flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.div
        className="flex-1 border-t border-gray-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
      />
      <motion.span
        className="text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.3 }}
      >
        {text}
      </motion.span>
      <motion.div
        className="flex-1 border-t border-gray-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
      />
    </motion.div>
  );
}
