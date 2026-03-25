import { cn } from "@/lib/utils";

export default function Container({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("w-full max-w-[1920px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24", className)}>
            {children}
        </div>
    );
}
