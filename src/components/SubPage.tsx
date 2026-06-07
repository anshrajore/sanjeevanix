import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function SubPage({
  tag,
  title,
  subtitle,
  children,
}: {
  tag: string;
  title: ReactNode;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      <main>
        <section className="relative pt-40 pb-16 overflow-hidden">
          <div className="absolute inset-0 grid-bg radial-fade opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,57,70,0.15),transparent_60%)]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-6xl mx-auto px-6 text-center"
          >
            <div className="inline-flex items-center gap-2 glass-red rounded-full px-4 py-1.5 text-xs uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" /> {tag}
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05]">{title}</h1>
            <p className="text-white/60 max-w-2xl mx-auto mt-6 text-lg">{subtitle}</p>
          </motion.div>
        </section>
        <section className="relative pb-32">
          <div className="max-w-7xl mx-auto px-6">{children}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
