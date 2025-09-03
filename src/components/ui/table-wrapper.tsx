import { cn } from "@/lib/utils";

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto overflow-y-visible">
        <div className="min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}