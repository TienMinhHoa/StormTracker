import { MoreHorizontal, Gamepad2, Plus, ThumbsUp, MessageCircle, Info } from "lucide-react"
import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b border-border px-6 py-3 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href="/about" 
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
            title="Về chúng tôi"
          >
            <Info className="w-4 h-4" />
            Giới thiệu
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Account">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM3 10c0 3.865 3.134 7 7 7s7-3.135 7-7-3.134-7-7-7-7 3.135-7 7z" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Gamepad">
            <Gamepad2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Add">
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="More">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Like">
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Comment">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
