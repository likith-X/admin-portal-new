"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Container from "@/app/components/ui/Container";
import { Scene } from "@/app/components/ui/hero-section";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--surface-lowest)' }}>
            {/* 3D Animated Background */}
            <div className="absolute inset-0 opacity-30">
                <Scene />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, var(--surface-lowest), transparent, var(--surface-lowest))'
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, var(--surface-lowest) 100%)'
            }} />

            <Container className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
                {/* Floating Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                        background: 'rgba(79, 242, 255, 0.05)',
                        border: '1px solid rgba(79, 242, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                    }}>
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>AI-Powered Prediction Markets</span>
                    </div>
                </motion.div>

                {/* Main Title */}
                <motion.div className="flex flex-col items-center justify-center tracking-tighter mb-6">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-normal text-center leading-none">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            className="block tracking-tight"
                            style={{
                                background: 'linear-gradient(180deg, var(--primary-fixed), var(--primary-muted))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                opacity: 0.9,
                            }}
                        >
                            Agent
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
                            className="block -mt-2 md:-mt-4 tracking-tight"
                            style={{
                                background: 'linear-gradient(180deg, var(--primary), var(--primary-container))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Herald
                        </motion.span>
                    </h1>
                </motion.div>

                {/* Tagline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-center mb-8 max-w-3xl"
                >
                    <h2 className="text-2xl md:text-4xl font-bold mb-4" style={{ color: 'var(--on-surface)' }}>
                        Built for{" "}
                        <span className="gradient-text">Trustless Markets</span>
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--on-surface-dim)' }}>
                        We combine the power of Large Language Models with the security of the Base blockchain to create a seamless prediction experience.
                    </p>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex flex-wrap justify-center gap-6 mb-12"
                >
                    {["ZERO DOWNTIME", "100% ON-CHAIN", "AI-VERIFIED RESULTS"].map((text) => (
                        <div key={text} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary)', boxShadow: '0 0 8px rgba(79, 242, 255, 0.4)' }} />
                            <span className="text-sm md:text-base font-medium tracking-wide" style={{ color: 'var(--on-surface-variant)' }}>{text}</span>
                        </div>
                    ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="flex flex-col sm:flex-row gap-4 items-center"
                >
                    <Link href="/contests">
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(79, 242, 255, 0.3)" }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-primary group relative px-8 py-4 text-base overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Browse Markets
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </motion.button>
                    </Link>

                    <Link href="/suggestions">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-ghost group px-8 py-4 text-base flex items-center gap-2"
                        >
                            <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                            View AI Suggestions
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Bottom Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="mt-16 flex flex-wrap justify-center gap-10 text-center"
                >
                    {[
                        { value: "100%", label: "Transparent" },
                        { value: "Base", label: "Mainnet" },
                        { value: "AI", label: "Powered" },
                    ].map(({ value, label }) => (
                        <div key={label} className="flex flex-col items-center">
                            <div className="text-3xl md:text-4xl font-bold gradient-text">{value}</div>
                            <div className="text-sm mt-1" style={{ color: 'var(--on-surface-muted)' }}>{label}</div>
                        </div>
                    ))}
                </motion.div>
            </Container>

            {/* Bottom Glow */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[700px] h-[350px] blur-[150px] pointer-events-none"
                style={{ background: 'rgba(79, 242, 255, 0.08)' }}
            />
            <div className="absolute bottom-0 left-0 w-full h-[200px] pointer-events-none" style={{
                background: 'linear-gradient(to top, var(--surface-lowest), transparent)'
            }} />
        </section>
    );
}
