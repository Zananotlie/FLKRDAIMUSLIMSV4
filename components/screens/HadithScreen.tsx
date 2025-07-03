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

const LiquidButton = React.memo(({ children, onClick, className = "" }: any) => (
  <button
    onClick={onClick}
    className={`
      bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-400/90 hover:to-purple-400/90
      backdrop-blur-xl rounded-2xl px-6 py-3 text-white font-medium
      transform transition-all duration-300 ease-out
      hover:scale-105 active:scale-95
      shadow-lg hover:shadow-xl
      ${className}
    `}
  >
    {children}
  </button>
))

LiquidButton.displayName = "LiquidButton"

export default function HadithScreen({ appState, fetchDailyHadith, t }: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-top duration-500">
      <h2 className="text-3xl font-bold text-white text-center">{t.hadith}</h2>

      {appState.dailyHadith && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            {appState.dailyHadith.arabic && (
              <p className="text-white/90 text-right text-lg leading-relaxed arabic-text">
                {appState.dailyHadith.arabic}
              </p>
            )}
            <p className="text-white/90 text-lg leading-relaxed">"{appState.dailyHadith.text}"</p>
            <p className="text-white/70 text-sm text-center">— {appState.dailyHadith.source}</p>
          </div>
        </GlassCard>
      )}

      <div className="flex justify-center">
        <LiquidButton onClick={fetchDailyHadith}>Get New Hadith</LiquidButton>
      </div>
    </div>
  )
}
