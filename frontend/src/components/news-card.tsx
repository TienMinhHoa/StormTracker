import { ImageIcon } from "lucide-react"

interface NewsCardProps {
  title: string
  category: string
}

export default function NewsCard({ title, category }: NewsCardProps) {
  return (
    <div className="bg-secondary rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Image Placeholder */}
      <div className="w-full aspect-square bg-muted flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Title */}
      <div className="p-3">
        <p className="text-xs font-medium text-foreground leading-tight line-clamp-3">{title}</p>
      </div>
    </div>
  )
}
