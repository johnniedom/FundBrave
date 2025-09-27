"use client";

import { motion } from "motion/react";
import { AuthHeroContent } from "../../../lib/auth-hero-content";

interface AuthHeroProps {
  variant: "signup" | "login";
}

export default function AuthHero({ variant }: AuthHeroProps) {
  const hero = AuthHeroContent.find((item) => item.key === variant);

  console.log(hero);

  if (!hero) {
    return null;
  }

  return (
    <motion.section
      className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        {hero.svg}
      </motion.div>

      <motion.h2
        className="text-center text-3xl font-semibold"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {hero.title}
      </motion.h2>

      <motion.p
        className="text-center text-base text-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {hero.subtitle}
      </motion.p>
    </motion.section>
  );
}
