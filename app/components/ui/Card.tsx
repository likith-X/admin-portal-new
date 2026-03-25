import { cn } from "@/lib/utils";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({ children, className, padding = "md" }: CardProps) {
    const paddingStyles = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={cn(
                "bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-sm",
                paddingStyles[padding],
                className
            )}
        >
            {children}
        </div>
    );
}
