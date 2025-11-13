import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Shield, Users, Zap, Globe } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <h1 className="text-2xl font-bold">Giới thiệu - StormTracker</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <Badge variant="default">v1.0.0</Badge>
              </div>
              <CardTitle className="text-3xl">StormTracker</CardTitle>
              <CardDescription className="text-lg">
                Hệ thống theo dõi và cảnh báo bão thông minh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                StormTracker là ứng dụng web hiện đại được xây dựng để giúp người dùng theo dõi 
                thông tin về bão, áp thấp nhiệt đới và các hiện tượng thời tiết nguy hiểm một cách 
                nhanh chóng và chính xác.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Cập nhật Real-time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Thông tin về bão được cập nhật liên tục từ nhiều nguồn tin tức 
                  và khí tượng uy tín, đảm bảo bạn luôn có thông tin mới nhất.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <CardTitle>Cảnh báo thông minh</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Hệ thống cảnh báo tự động phân loại mức độ nguy hiểm và 
                  gửi thông báo kịp thời để bạn có thể chuẩn bị ứng phó.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <CardTitle>Chatbot hỗ trợ AI</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Trợ lý AI thông minh sẵn sàng trả lời mọi câu hỏi của bạn 
                  về thời tiết, bão và các biện pháp phòng tránh.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <CardTitle>Giao diện hiện đại</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Thiết kế responsive, hỗ trợ dark mode và tối ưu cho 
                  mọi thiết bị từ desktop đến mobile.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Công nghệ sử dụng</CardTitle>
              <CardDescription>
                StormTracker được xây dựng với các công nghệ web hiện đại nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Next.js 16</Badge>
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
                <Badge variant="secondary">Lucide Icons</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Liên hệ & Đóng góp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Dự án này được phát triển như một phần của cuộc thi lập trình Procon.
              </p>
              <p className="text-sm text-muted-foreground">
                Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ với chúng tôi.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
