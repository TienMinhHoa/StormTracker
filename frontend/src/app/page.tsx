"use client"

import { useState } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import MainContent from "@/components/main-content"
import WarningsContent from "@/components/warnings-content"
import ChatbotContent from "@/components/chatbot-content"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("news")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {activeTab === "news" && <MainContent />}
        {activeTab === "warnings" && <WarningsContent />}
        {activeTab === "chatbot" && <ChatbotContent />}
      </div>
    </div>
  )
}
