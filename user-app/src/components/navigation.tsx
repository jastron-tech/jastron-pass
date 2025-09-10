'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SuiWalletButtonStable } from '@/lib/sui';

const navigation = [
  {
    name: '用戶中心',
    href: '/user',
    description: '票券購買與管理',
  },
  {
    name: '主辦方中心',
    href: '/organizer',
    description: '活動創建與管理',
  },
  {
    name: '平台管理',
    href: '/platform',
    description: '平台運營與設定',
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">JP</span>
              </div>
              <span className="font-bold text-xl">Jastron Pass</span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <SuiWalletButtonStable />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Breadcrumb component for page context
export function Breadcrumb() {
  const pathname = usePathname();
  
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/user':
        return '用戶中心';
      case '/organizer':
        return '主辦方中心';
      case '/platform':
        return '平台管理';
      default:
        return 'Jastron Pass';
    }
  };

  const getPageDescription = (path: string) => {
    switch (path) {
      case '/user':
        return '管理您的票券和購買活動';
      case '/organizer':
        return '創建和管理您的活動';
      case '/platform':
        return '管理平台運營和設定';
      default:
        return '基於 Sui 區塊鏈的票券平台';
    }
  };

  return (
    <div className="border-b bg-muted/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <Link 
            href="/" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            首頁
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{getPageTitle(pathname)}</span>
        </div>
        <h1 className="text-2xl font-bold mt-1">{getPageTitle(pathname)}</h1>
        <p className="text-muted-foreground text-sm mt-1">{getPageDescription(pathname)}</p>
      </div>
    </div>
  );
}
