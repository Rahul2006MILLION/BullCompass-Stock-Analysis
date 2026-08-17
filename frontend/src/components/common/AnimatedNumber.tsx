"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform, useReducedMotion } from "framer-motion";

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
  const shouldReduceMotion = useReducedMotion();
  const spring = useSpring(shouldReduceMotion ? value : 0, {
    mass: 0.5,
    stiffness: 95,
    damping: 19,
  });

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

  if (shouldReduceMotion) {
    let formatted = "";
    if (format === "currency") {
      const sign = value < 0 ? "-" : "";
      formatted = `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    } else if (format === "percent") {
      const sign = value > 0 ? "+" : "";
      formatted = `${sign}${value.toFixed(decimals)}%`;
    } else {
      formatted = value.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    return (
      <span className={className}>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}
