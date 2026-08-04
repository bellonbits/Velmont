import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSEO } from "../lib/seo";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

export function Splash() {
  const navigate = useNavigate();

  useSEO({
    title: "Velmont — Cheap Watches in Kenya | Men's & Women's Watches, Nationwide Delivery",
    description:
      "Shop affordable, genuine watches in Kenya from Casio, G-Shock, Seiko, Citizen and more. Men's, women's, and unisex watches from KSh 2,400, with fast delivery across Nairobi and countrywide.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white md:relative">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-10 md:max-w-6xl md:flex-row md:items-center md:gap-16 md:px-16 md:py-10"
      >
        <motion.div variants={item} className="flex items-center justify-center gap-2 md:absolute md:left-16 md:top-10 md:justify-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-sm">
            V
          </span>
          <span className="text-sm tracking-wide text-white/80">Velmont.co</span>
        </motion.div>

        <div className="md:flex-1">
          <motion.h1
            variants={item}
            className="mt-10 text-center text-4xl font-semibold leading-tight tracking-tight md:mt-0 md:text-left md:text-6xl"
          >
            The <span className="font-bold">Perfect Moment</span> Between Past And Future.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 hidden text-base text-white/60 md:block md:max-w-md"
          >
            Discover watches from Casio, Seiko, Citizen, G-Shock, and more — genuine stock,
            delivered across Kenya.
          </motion.p>

          <motion.button
            variants={item}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/home")}
            className="mb-10 mt-8 w-full rounded-full border border-white py-4 text-sm font-medium tracking-wide transition hover:bg-white hover:text-neutral-950 md:mb-0 md:w-auto md:px-10"
          >
            Explore Collection
          </motion.button>
        </div>

        <motion.div
          variants={item}
          className="flex flex-1 items-center justify-center"
        >
          <motion.img
            src="/images/curren-classic-steel-transparent.png"
            alt="Curren Classic Steel"
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="h-auto w-72 max-w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] md:w-[26rem]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
