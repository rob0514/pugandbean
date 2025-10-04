"use client";
import { motion } from "motion/react";
//import Image from "next/image";

export default function Home() {
  return (
    <main className="grid place-items-center py-24">
      <motion.h1
        className="text-3xl font-medium"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        M0 Bootstrap ✓
      </motion.h1>
    </main>
  );
}
