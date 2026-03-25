import Container from "@/app/components/ui/Container";
import { motion } from "framer-motion";
import { Brain, Lock, Zap, Wallet } from "lucide-react";

export default function FeaturesSection() {
    const features = [
        {
            icon: Brain,
            title: "AI-Generated Questions",
            description: "Automatically analyze news articles and generate verifiable prediction questions with advanced AI.",
            gradient: "from-blue-500/20 to-cyan-500/20",
            iconColor: "text-blue-400",
            className: "md:col-span-1" // Regular card
        },
        {
            icon: Lock,
            title: "Blockchain Verified",
            description: "All contests are created and resolved on Base Mainnet for immutable transparency and security.",
            gradient: "from-indigo-500/20 to-blue-500/20",
            iconColor: "text-indigo-400",
            className: "md:col-span-1" // Regular card
        },
        {
            icon: Zap,
            title: "Oracle Resolution",
            description: "AI-assisted resolution with admin oversight for accurate and fair outcomes in real-time.",
            gradient: "from-cyan-500/20 to-teal-500/20",
            iconColor: "text-cyan-400",
            className: "md:col-span-1"
        },
        {
            icon: Wallet,
            title: "Instant Settlements",
            description: "Smart contracts automatically distribute winnings to your wallet immediately after resolution.",
            gradient: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400",
            className: "md:col-span-1"
        }
    ];

    return (
        <section className="relative py-24 bg-[#050510]">
            {/* Background glow for differentiation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Sticky Title for Desktop */}
                    <div className="space-y-6 max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Built for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                    Trustless Markets
                                </span>
                            </h2>
                            <p className="text-lg text-gray-400 leading-relaxed mb-8">
                                We combine the power of Large Language Models with the security of the Base blockchain to create a seamless prediction experience.
                            </p>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="w-8 h-[1px] bg-blue-500" />
                                    <span className="text-sm font-medium uppercase tracking-wider">Zero Downtime</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <div className="w-8 h-[1px] bg-cyan-500" />
                                    <span className="text-sm font-medium uppercase tracking-wider">100% On-Chain</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className={`group relative h-full ${feature.className}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className="relative h-full bg-white/5 border border-white/10 p-8 rounded-3xl shadow-lg backdrop-blur-sm group-hover:border-white/20 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                                            <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}
