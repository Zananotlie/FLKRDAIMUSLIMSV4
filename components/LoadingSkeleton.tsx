import type React from "react"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  height?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = "", lines = 3, height = "h-4" }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`bg-white/20 rounded-lg ${height} mb-3 last:mb-0`}
            style={{
              width: `${Math.random() * 40 + 60}%`,
              animationDelay: `${index * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
