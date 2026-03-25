import Container from "@/app/components/ui/Container";
import { motion } from "framer-motion";
import { ShieldCheck, Brain, TrendingUp } from "lucide-react";

export default function StatsSection() {
    const stats = [
        { label: "Contest Storage", value: "On-Chain", icon: ShieldCheck },
        { label: "Question Generation", value: "AI-Powered", icon: Brain },
        { label: "Network", value: "Base Mainnet", icon: TrendingUp },
    ];

    return (
        <section className="relative z-10 -mt-16">
            <Container>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="text-center p-4 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <stat.icon className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </Container>
        </section>
    );
}
