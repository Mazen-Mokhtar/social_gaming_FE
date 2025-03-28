'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  TowerControl, 
  Home, 
  Users, 
  Bell, 
  MessageSquare, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchCounts();
  }, [pathname]);

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': token || '' };

      // Don't fetch notification count if on notifications page
      if (pathname !== '/dashboard/notifications') {
        const notifResponse = await fetch('http://localhost:3001/notification/count', { headers });
        const notifData = await notifResponse.json();
        if (notifData.success) {
          setNotificationCount(notifData.data);
        }
      } else {
        setNotificationCount(0);
      }

      // Don't fetch friend request count if on friends page
      if (pathname !== '/dashboard/friends') {
        const friendResponse = await fetch('http://localhost:3001/friend/getCountRequest', { headers });
        const friendData = await friendResponse.json();
        if (friendData.success) {
          setFriendRequestCount(friendData.data);
        }
      } else {
        setFriendRequestCount(0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/auth/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { 
      icon: Users, 
      label: 'Friends', 
      href: '/dashboard/friends',
      count: friendRequestCount 
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      href: '/dashboard/notifications',
      count: notificationCount 
    },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
  ];

  const renderNavItem = (item: any) => (
    <Link 
      href={item.href}
      className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-purple-600/10 transition-colors text-gray-300 hover:text-white"
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div className="flex items-center space-x-3">
        <item.icon className="w-5 h-5 text-purple-400" />
        <span>{item.label}</span>
      </div>
      {item.count > 0 && (
        <Badge className="bg-purple-600 hover:bg-purple-700">
          {item.count}
        </Badge>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-[#0f0f0f]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1a1a] border-r border-purple-500/20 fixed h-screen">
        <div className="p-4 border-b border-purple-500/20">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <TowerControl className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Gaming Social
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.label}>
                {renderNavItem(item)}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-purple-500/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a1a1a] border-b border-purple-500/20 z-50">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <TowerControl className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Gaming Social
            </span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-purple-600/10 rounded-lg text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-purple-400" />
            ) : (
              <Menu className="w-6 h-6 text-purple-400" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="bg-[#1a1a1a] border-b border-purple-500/20 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  {renderNavItem(item)}
                </li>
              ))}
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 md:mt-0 mt-16">
        {children}
      </div>
    </div>
  );
}