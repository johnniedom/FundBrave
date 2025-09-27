"use client";
import React from "react";

import SignupPage from "./signup/page";
import LoginPage from "./login/page";
import AuthHero from "../components/auth/AuthHero";
import { AnimatePresence, motion } from "motion/react";

const swipeVariants = (direction: "left" | "right") => ({
  enter: {
    x: direction === "left" ? "100%" : "-100%",
    opacity: 0,
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: {
    zIndex: 0,
    x: direction === "left" ? "100%" : "-100%",
    opacity: 0,
  },
});

const Page = () => {
  const [view, setView] = React.useState<"signup" | "login">("signup");

  const handleToggle = () => {
    setView((prev) => (prev === "signup" ? "login" : "signup"));
  };

  return (
    <div className="flex h-dvh">
      <motion.aside className="hidden h-full w-1/2 py-10 lg:flex">
        <AnimatePresence initial={false} mode="wait">
          <AuthHero variant="login" />
        </AnimatePresence>

        <div className="flex justify-center items-center gap-4"></div>
      </motion.aside>

      {/* {heroContent.map((_, i) => (
              <div
                key={i}
                onClick={() => paginate(i)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${
                  view === i ? 'p-1 bg-purple-400' : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))} */}

      <main className="flex h-full w-full flex-col items-center justify-center overflow-auto  px-4 py-10 backdrop-blur md:px-8 lg:w-1/2">
        <div className="size-full">
          <AnimatePresence initial={false} mode="wait">
            {view === "signup" ? (
              <SignupPage onToggle={handleToggle} />
            ) : (
              <LoginPage onToggle={handleToggle} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Page;
