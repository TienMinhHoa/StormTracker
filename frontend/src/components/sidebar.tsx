"use client"

import { Cloud, MessageSquare, AlertTriangle, Settings, HelpCircle, LogOut, MapPinPlus } from "lucide-react"
import NewsCard from "./news-card"

const categories = [
  { id: "all", label: "All" },
  { id: "tornadoes", label: "Tornadoes" },
  { id: "hurricanes", label: "Hurricanes" },
  { id: "floods", label: "Floods" },
  { id: "wildfires", label: "Wildfires" },
]

const newsArticles = [
  {
    id: 1,
    title: "New satellite images show Hurricane Leo's path",
    category: "hurricanes",
  },
  {
    id: 2,
    title: "Understanding the new 'Tornado Alley' shift",
    category: "tornadoes",
  },
  {
    id: 3,
    title: "How to prepare for flash flood events",
    category: "floods",
  },
  {
    id: 4,
    title: "Wildfire smoke tracker: Air quality updates",
    category: "wildfires",
  },
  {
    id: 5,
    title: "Climate patterns affecting storm frequency",
    category: "all",
  },
  {
    id: 6,
    title: "New weather prediction models deployed",
    category: "all",
  },
]

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export default function Sidebar({ activeTab, onTabChange, selectedCategory, onCategoryChange }: SidebarProps) {
  const tabs = [
    { id: "news", label: "News", icon: Cloud },
    { id: "warnings", label: "Warnings", icon: AlertTriangle },
    { id: "chatbot", label: "Chatbot", icon: MessageSquare },
  ]

  const filteredArticles =
    selectedCategory === "all" ? newsArticles : newsArticles.filter((article) => article.category === selectedCategory)

  return (
    <div className="w-80 bg-card border-r border-border overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <Cloud className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">StormTrack</h1>
            <p className="text-sm text-muted-foreground">Advanced Weather Monitoring</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "news" && (
        <>
          {/* Category Filters */}
          <div className="p-4 border-b border-border">
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* News Articles */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <NewsCard key={article.id} title={article.title} category={article.category} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Menu */}
      <div className={`${activeTab === "news" ? "" : "flex-1"} border-t border-border p-4 space-y-2`}>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm">Help</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Log Out</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <MapPinPlus className="w-5 h-5" />
          <span className="text-sm">Send Help Request</span>
        </button>
      </div>
    </div>
  )
}
