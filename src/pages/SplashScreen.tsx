import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoVn3 from "@/assets/logo-vn3.png";
import splashBg from "@/assets/splash-bg.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SPLASH_DURATION = 5000; // ms

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, SPLASH_DURATION);

    return () => clearTimeout(exitTimer);
  }, []);

  const handleExitComplete = () => {
    onFinish();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!isExiting && (
        <motion.div
          key="splash"
          initial={{ y: 0 }}
          exit={{ y: "-100%"  }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col"
        >
          {/* ── Background image + gradient overlay ── */}
          <div className="absolute inset-0">
            <img
              src={splashBg}
              alt=""
              className="h-full w-full object-cover"
            />
            {/* Gradient overlay — navy blue, matching VN3 brand */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, hsla(215,70%,12%,0.85), hsla(215,65%,18%,0.80), hsla(215,70%,10%,0.95))",
              }}
            />
          </div>

          {/* ── Content ── */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8">
            {/* Glow atrás do logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute h-48 w-48 rounded-full bg-[hsl(195,85%,55%)] blur-[80px] opacity-30"
            />

            {/* Logo com Scale Up */}
            <motion.img
              src={logoVn3}
              alt="VN3 Internet"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative z-10 h-28 w-auto drop-shadow-2xl"
            />

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="relative z-10 mt-4 text-sm font-medium tracking-wider text-white/60"
            >
              Internet Ultraveloz
            </motion.p>
          </div>

          {/* ── Progress bar no rodapé ── */}
          <div className="relative z-10 px-12 pb-14">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: SPLASH_DURATION / 1000,
                  ease: "linear",
                }}
                className="h-full rounded-full bg-gradient-to-r from-[hsl(195,85%,55%)] to-[hsl(195,80%,65%)]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
