import Container from "@/app/components/ui/Container";
import { motion } from "framer-motion";
import { Search, Brain, MousePointerClick, Trophy } from "lucide-react";

export default function HowItWorksSection() {
    const steps = [
        {
            icon: Search,
            title: "Discover Markets",
            description: "Explore a wide range of prediction markets generated from real-time news events.",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            icon: Brain,
            title: "AI Analysis",
            description: "Review detailed AI-powered insights and probabilities for every market.",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            icon: MousePointerClick,
            title: "Place Your Vote",
            description: "Securely cast your prediction on-chain using Base network.",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20"
        },
        {
            icon: Trophy,
            title: "Win & Earn",
            description: "Get resolved automatically by AI oracles and claim your rewards instantly.",
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/20"
        }
    ];

    return (
        <section className="relative py-24 bg-[#050510] overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 relative z-10"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        How It Works
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        A simple, transparent process powered by artificial intelligence and blockchain technology.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center relative z-10">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 z-0" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative z-10 flex flex-col items-center space-y-4 group"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${step.bg} ${step.border} border flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 relative`}>
                                <step.icon className={`w-8 h-8 ${step.color}`} />
                                <div className={`absolute inset-0 ${step.bg} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{step.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
