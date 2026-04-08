import {motion} from "framer-motion";
import {Car, Cog, Disc3, Droplets, Filter, Gauge, Wrench, Zap} from "lucide-react";
import type {ComponentType, CSSProperties} from "react";

type DriftLine = {
  width: number;
  rotate: number;
  duration: number;
  delay: number;
  style: CSSProperties;
};

type FloatingPart = {
  Icon: ComponentType<{className?: string}>;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  style: CSSProperties;
};

type Particle = {
  size: number;
  duration: number;
  delay: number;
  style: CSSProperties;
};

const driftLines: DriftLine[] = [
  {width: 260, rotate: -16, duration: 12, delay: 0, style: {top: "13%", left: "8%"}},
  {width: 220, rotate: 11, duration: 10, delay: 0.8, style: {top: "29%", right: "10%"}},
  {width: 250, rotate: -12, duration: 14, delay: 1.4, style: {top: "52%", left: "20%"}},
  {width: 280, rotate: 9, duration: 11, delay: 0.5, style: {top: "72%", right: "16%"}},
  {width: 180, rotate: -9, duration: 9, delay: 1.8, style: {top: "84%", left: "35%"}}
];

const floatingParts: FloatingPart[] = [
  {Icon: Filter, size: 52, rotate: -12, duration: 15, delay: 0.2, style: {top: "17%", left: "14%"}},
  {Icon: Droplets, size: 46, rotate: 10, duration: 17, delay: 0.6, style: {top: "23%", right: "14%"}},
  {Icon: Zap, size: 44, rotate: -8, duration: 13, delay: 1.2, style: {top: "38%", left: "6%"}},
  {Icon: Disc3, size: 54, rotate: 16, duration: 16, delay: 0.1, style: {top: "44%", right: "24%"}},
  {Icon: Cog, size: 56, rotate: -18, duration: 18, delay: 0.9, style: {top: "58%", left: "28%"}},
  {Icon: Gauge, size: 50, rotate: 7, duration: 14, delay: 0.4, style: {top: "63%", right: "7%"}},
  {Icon: Wrench, size: 52, rotate: -14, duration: 17, delay: 1.5, style: {top: "79%", left: "16%"}}
];

const particles: Particle[] = [
  {size: 4, duration: 8, delay: 0.2, style: {top: "18%", left: "38%"}},
  {size: 5, duration: 10, delay: 1.1, style: {top: "22%", left: "62%"}},
  {size: 6, duration: 12, delay: 0.7, style: {top: "34%", left: "48%"}},
  {size: 4, duration: 9, delay: 1.8, style: {top: "46%", left: "72%"}},
  {size: 5, duration: 11, delay: 0.4, style: {top: "55%", left: "58%"}},
  {size: 4, duration: 10, delay: 1.4, style: {top: "66%", left: "44%"}},
  {size: 6, duration: 13, delay: 0.9, style: {top: "74%", left: "69%"}},
  {size: 5, duration: 9, delay: 0.3, style: {top: "82%", left: "54%"}}
];

export default function AutoBackdrop() {
  return (
    <div className="auto-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {driftLines.map((line, index) => (
        <motion.span
          key={`drift-${index}`}
          className="auto-drift-line absolute"
          style={{width: line.width, ...line.style}}
          animate={{x: [-18, 24, -12], opacity: [0, 0.55, 0], rotate: [line.rotate, line.rotate + 2, line.rotate]}}
          transition={{duration: line.duration, repeat: Infinity, ease: "easeInOut", delay: line.delay}}
        />
      ))}

      {floatingParts.map((part, index) => {
        const Icon = part.Icon;
        return (
          <motion.div
            key={`part-${index}`}
            className="auto-part absolute flex items-center justify-center rounded-full"
            style={{width: part.size, height: part.size, ...part.style}}
            animate={{y: [0, -12, 0], rotate: [part.rotate, part.rotate + 20, part.rotate]}}
            transition={{duration: part.duration, repeat: Infinity, ease: "easeInOut", delay: part.delay}}
          >
            <Icon className="h-[58%] w-[58%]" />
          </motion.div>
        );
      })}

      {particles.map((particle, index) => (
        <motion.span
          key={`particle-${index}`}
          className="auto-particle absolute rounded-full"
          style={{width: particle.size, height: particle.size, ...particle.style}}
          animate={{y: [0, -18, 0], opacity: [0.08, 0.5, 0.08]}}
          transition={{duration: particle.duration, repeat: Infinity, ease: "easeInOut", delay: particle.delay}}
        />
      ))}

      <motion.div
        className="auto-car-runner absolute bottom-[6%] left-[-20%] flex items-center"
        animate={{x: ["0vw", "35vw", "125vw"], opacity: [0, 1, 0]}}
        transition={{duration: 14, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 1], repeatDelay: 2}}
      >
        <span className="auto-car-trace mr-3 block h-[2px] w-28" />
        <Car className="h-8 w-8" />
      </motion.div>
    </div>
  );
}
