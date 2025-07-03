"use client"

import React from "react"
import { Sun, Moon } from "lucide-react"

const GlassCard = React.memo(({ children, className = "" }: any) => (
  <div
    className={`bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

export default function SettingsScreen({ appState, setAppState, t }: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-3xl font-bold text-white text-center">{t.settings}</h2>

      <div className="space-y-4">
        <GlassCard className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">{t.language}</span>
            <select
              value={appState.language}
              onChange={(e) => setAppState((prev: any) => ({ ...prev, language: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="sorani">کوردی</option>
              <option value="badini">Badini</option>
            </select>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">{t.theme}</span>
            <button
              onClick={() => setAppState((prev: any) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }))}
              className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white"
            >
              {appState.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {appState.theme === "dark" ? t.darkMode : t.lightMode}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
