import {motion} from "framer-motion";
import type {CSSProperties} from "react";

type Orb = {
  size: number;
  color: string;
  duration: number;
  delay: number;
  style: CSSProperties;
};

const orbs: Orb[] = [
  {size: 280, color: "bg-brand-400/16", duration: 13, delay: 0, style: {top: "10%", left: "5%"}},
  {size: 360, color: "bg-pulse-500/16", duration: 16, delay: 1.5, style: {top: "18%", right: "8%"}},
  {size: 220, color: "bg-flame-500/14", duration: 14, delay: 0.6, style: {bottom: "14%", left: "18%"}},
  {size: 260, color: "bg-brand-500/14", duration: 18, delay: 2.2, style: {bottom: "6%", right: "20%"}}
];

export default function NeonBackdrop() {
  return (
    <div className="neon-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-mesh-gradient" />
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${orb.color}`}
          style={{width: orb.size, height: orb.size, ...orb.style}}
          animate={{x: [0, 26, -18, 0], y: [0, -24, 16, 0], opacity: [0.5, 0.9, 0.6, 0.5]}}
          transition={{duration: orb.duration, repeat: Infinity, ease: "easeInOut", delay: orb.delay}}
        />
      ))}
    </div>
  );
}
