import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-dark-primary animate-spin`} />
      {text && (
        <p className="mt-2 text-sm text-dark-secondary animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="dark-card animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-dark-color rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-dark-color rounded w-3/4"></div>
          <div className="h-3 bg-dark-color rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="dark-card animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-dark-color rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-dark-color rounded w-32"></div>
                <div className="h-3 bg-dark-color rounded w-24"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-dark-color rounded w-16"></div>
              <div className="h-6 bg-dark-color rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 