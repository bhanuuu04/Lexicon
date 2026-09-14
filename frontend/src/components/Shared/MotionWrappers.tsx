"use client";

import React from "react";
import { motion, Variants, HTMLMotionProps } from "framer-motion";

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const drawerVariants: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 28, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
};

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const FadeUp: React.FC<MotionDivProps> = ({ children, className = "", delay = 0, ...props }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-40px" }}
    variants={{
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const FadeIn: React.FC<MotionDivProps> = ({ children, className = "", delay = 0, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);
