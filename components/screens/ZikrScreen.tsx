"use client"

import React from "react"

const GlassCard = React.memo(({ children, className = "" }: any) => (
  <div
    className={`bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

const LiquidButton = React.memo(({ children, onClick, variant = "primary", className = "" }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-400/90 hover:to-purple-400/90",
    glass: "bg-white/10 hover:bg-white/20 border border-white/20",
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${variants[variant]}
        backdrop-blur-xl rounded-2xl px-6 py-3 text-white font-medium
        transform transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        ${className}
      `}
    >
      {children}
    </button>
  )
})

LiquidButton.displayName = "LiquidButton"

const ZikrButton = React.memo(({ type, count, onClick }: any) => {
  const colors = {
    subhanallah: "from-blue-500 to-cyan-500",
    alhamdulillah: "from-green-500 to-emerald-500",
    allahuakbar: "from-purple-500 to-pink-500",
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-32 h-32 rounded-full bg-gradient-to-r ${colors[type]}
        shadow-2xl transform transition-all duration-300
        hover:scale-110 active:scale-95
        flex items-center justify-center text-white font-bold text-lg
        relative overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-full animate-pulse" />
      <span className="relative z-10">{count}</span>
    </button>
  )
})

ZikrButton.displayName = "ZikrButton"

export default function ZikrScreen({ appState, setAppState, t }: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-3xl font-bold text-white text-center">{t.tasbeeh}</h2>

      {/* Zikr Type Selector */}
      <div className="flex justify-center gap-2">
        {(["subhanallah", "alhamdulillah", "allahuakbar"] as const).map((type) => (
          <LiquidButton
            key={type}
            onClick={() => setAppState((prev: any) => ({ ...prev, zikrType: type }))}
            variant={appState.zikrType === type ? "primary" : "glass"}
            className="text-sm px-4 py-2"
          >
            {t[type]}
          </LiquidButton>
        ))}
      </div>

      <GlassCard className="p-8">
        <div className="text-center space-y-8">
          <div className="text-7xl font-bold text-blue-300 font-mono">{appState.zikrCount}</div>

          <ZikrButton
            type={appState.zikrType}
            count={appState.zikrCount}
            onClick={() => setAppState((prev: any) => ({ ...prev, zikrCount: prev.zikrCount + 1 }))}
          />

          <div className="flex justify-center gap-4">
            <LiquidButton onClick={() => setAppState((prev: any) => ({ ...prev, zikrCount: 0 }))} variant="glass">
              {t.reset}
            </LiquidButton>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
