import { motion } from "framer-motion";
import { BottomNav } from "../components/BottomNav";
import { ThemeToggle } from "../components/ThemeToggle";
import { useSEO } from "../lib/seo";

const WHATSAPP_NUMBER = "254793046776"; // 0793 046 776 in international format
const DEFAULT_MESSAGE = "Hi Velmont, I'd like some help with a watch.";

function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const QUICK_TOPICS = [
  "I have a question about an order",
  "Is this watch available in stock?",
  "I'd like help choosing a watch",
  "I want to ask about warranty or returns",
];

export function Chat() {
  useSEO({
    title: "Contact Us on WhatsApp | Velmont Kenya",
    description:
      "Chat with Velmont on WhatsApp for help with orders, sizing, watch availability, and delivery across Kenya.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-8 pt-8 md:max-w-xl md:px-8 md:pt-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">Chat with us</h1>
          <ThemeToggle className="md:hidden" />
        </div>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Message our team directly on WhatsApp for quick help with orders, sizing, or
          availability.
        </p>

        <motion.a
          href={waLink(DEFAULT_MESSAGE)}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.98 }}
          className="mt-6 flex items-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-white"
        >
          <WhatsAppIcon />
          <div className="flex-1">
            <p className="text-sm font-semibold">Chat on WhatsApp</p>
            <p className="text-xs text-white/80">+254 793 046 776</p>
          </div>
          <ArrowIcon />
        </motion.a>

        <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Common topics
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {QUICK_TOPICS.map((topic) => (
            <a
              key={topic}
              href={waLink(topic)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              {topic}
              <ArrowIcon className="text-neutral-300 dark:text-neutral-600" />
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          We typically reply within a few hours, 8am–8pm EAT.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.35a9.9 9.9 0 0 0 4.62 1.14h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.31-1.93 1.35-.5.05-1.02.24-3.42-.7-2.9-1.15-4.77-4.1-4.91-4.29-.14-.19-1.17-1.56-1.17-2.98s.75-2.11 1.01-2.4c.26-.29.58-.36.77-.36h.55c.18 0 .42-.03.64.49.24.56.8 1.94.87 2.08.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.61-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.62-.14.26.09 1.62.77 1.9.91.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
