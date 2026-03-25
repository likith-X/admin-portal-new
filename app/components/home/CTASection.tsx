import Container from "@/app/components/ui/Container";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Main Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-[#050510]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />

            <Container>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 flex flex-col items-center justify-center text-center p-12 md:p-20 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                    {/* Glowing Effect */}
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-cyan-500/20 blur-3xl rounded-full animate-pulse delay-1000" />

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10 tracking-tight">
                        Start Predicting <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                            The Future Today
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-2xl relative z-10">
                        Join thousands of users on the most transparent, AI-verified prediction market on Base.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                Launch App
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </Link>
                        <Link href="/contests">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                            >
                                Browse Markets
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}
