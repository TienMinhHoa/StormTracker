"use client"

import { useState } from "react"

interface WarningItem {
  id: number
  title: string
  location: string
  time: string
  severity: "critical" | "high" | "moderate" | "low"
}

const warnings: WarningItem[] = [
  {
    id: 1,
    title: "Tropical Storm Alert",
    location: "Coastal Region, Bay Area",
    time: "2h ago",
    severity: "critical",
  },
  {
    id: 2,
    title: "Flash Flood Warning",
    location: "River Valley, Lowland Plains",
    time: "5h ago",
    severity: "high",
  },
  {
    id: 3,
    title: "High Surf Advisory",
    location: "Southern Beaches",
    time: "8h ago",
    severity: "moderate",
  },
  {
    id: 4,
    title: "Thunderstorm Watch",
    location: "Inland Counties",
    time: "10h ago",
    severity: "moderate",
  },
]

const severityColors = {
  critical: {
    border: "border-l-4 border-red-500",
    bg: "bg-red-950/30",
    text: "text-red-300",
  },
  high: {
    border: "border-l-4 border-yellow-500",
    bg: "bg-yellow-950/30",
    text: "text-yellow-300",
  },
  moderate: {
    border: "border-l-4 border-green-500",
    bg: "bg-green-950/30",
    text: "text-green-300",
  },
  low: {
    border: "border-l-4 border-blue-500",
    bg: "bg-blue-950/30",
    text: "text-blue-300",
  },
}

export default function WarningsContent() {
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")

  const filteredWarnings =
    typeFilter === "all" && severityFilter === "all"
      ? warnings
      : warnings.filter((w) => {
          const matchesType = typeFilter === "all" || w.title.toLowerCase().includes(typeFilter.toLowerCase())
          const matchesSeverity = severityFilter === "all" || w.severity === severityFilter
          return matchesType && matchesSeverity
        })

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Warnings List */}
      <div className="w-96 border-r border-border bg-card overflow-y-auto flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">All Types</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="tropical">Tropical Storm</option>
              <option value="flood">Flash Flood</option>
              <option value="surf">Surf Advisory</option>
              <option value="thunderstorm">Thunderstorm</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">All Severities</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Warnings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredWarnings.map((warning) => {
            const colors = severityColors[warning.severity]
            return (
              <div
                key={warning.id}
                className={`${colors.border} ${colors.bg} p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${colors.text}`}>{warning.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{warning.location}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{warning.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right - Map */}
      <div className="flex-1 bg-gradient-to-br from-teal-900 via-blue-900 to-teal-800 relative overflow-hidden">
        <img
          src="/world-map-topography.jpg"
          alt="Global weather map"
          className="w-full h-full object-cover opacity-90"
        />
        {/* Map Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
          <button className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-foreground shadow-lg">
            +
          </button>
          <button className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-foreground shadow-lg">
            −
          </button>
        </div>
        {/* Target Button */}
        <div className="absolute bottom-8 right-24">
          <button className="w-12 h-12 bg-accent hover:bg-accent/90 rounded-lg flex items-center justify-center text-accent-foreground shadow-lg">
            ⊙
          </button>
        </div>
      </div>
    </div>
  )
}
