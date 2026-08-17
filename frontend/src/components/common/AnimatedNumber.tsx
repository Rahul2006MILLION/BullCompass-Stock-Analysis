"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format?: "currency" | "percent" | "number";
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  format = "currency",
  decimals = 2,
  className,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const spring = useSpring(0, { mass: 0.6, stiffness: 85, damping: 18 });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const display = useTransform(spring, (latest) => {
    if (isNaN(latest)) return "0";

    if (format === "currency") {
      const sign = latest < 0 ? "-" : "";
      const absVal = Math.abs(latest);
      return `${sign}₹${absVal.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    }

    if (format === "percent") {
      const sign = latest > 0 ? "+" : "";
      return `${sign}${latest.toFixed(decimals)}%`;
    }

    return latest.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}
