import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roles = [
  {
    name: '用戶',
    description: '購買票券、管理我的票券',
    href: '/user',
    icon: '🎫',
    features: ['瀏覽活動', '購買票券', '管理票券', '查看交易記錄'],
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    name: '主辦方',
    description: '創建活動、管理票券銷售',
    href: '/organizer',
    icon: '🎪',
    features: ['創建活動', '管理票券', '查看銷售統計', '設定票價'],
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    name: '平台管理',
    description: '管理平台運營、設定費用',
    href: '/platform',
    icon: '⚙️',
    features: ['平台統計', '費用管理', '金庫管理', '系統設定'],
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
];

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">JP</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold">Jastron Pass</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          基於 Sui 區塊鏈的現代化票券平台，為活動主辦方和用戶提供安全、透明的票券交易體驗
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">Sui 區塊鏈</Badge>
          <Badge variant="outline">去中心化</Badge>
          <Badge variant="outline">安全交易</Badge>
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">選擇您的角色</h2>
          <p className="text-muted-foreground">
            請選擇您的身份以開始使用 Jastron Pass 平台
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.name} className={`transition-all duration-200 hover:shadow-lg ${role.color}`}>
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">{role.icon}</div>
                <CardTitle className="text-xl">{role.name}</CardTitle>
                <CardDescription className="text-base">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={role.href} className="block">
                  <Button className="w-full">
                    進入 {role.name}中心
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">平台特色</h2>
          <p className="text-muted-foreground">
            體驗下一代票券平台的強大功能
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">安全可靠</h3>
              <p className="text-sm text-muted-foreground">
                基於 Sui 區塊鏈，確保交易安全
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">快速交易</h3>
              <p className="text-sm text-muted-foreground">
                即時確認，無需等待
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold mb-1">透明費用</h3>
              <p className="text-sm text-muted-foreground">
                清晰的費用結構，無隱藏成本
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">易於使用</h3>
              <p className="text-sm text-muted-foreground">
                直觀的界面，簡單操作
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">想要體驗完整功能？</h3>
            <p className="text-muted-foreground">
              連接您的 Sui 錢包，開始使用 Jastron Pass 平台
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/user">
                <Button variant="outline">瀏覽活動</Button>
              </Link>
              <Link href="/organizer">
                <Button variant="outline">創建活動</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}