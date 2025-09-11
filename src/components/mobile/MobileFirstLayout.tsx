import React from 'react';
import { Menu, X, Monitor, User, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

interface MobileFirstLayoutProps {
  children: React.ReactNode;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  navigationItems: Array<{
    icon: React.ComponentType<any>;
    label: string;
    group?: string;
  }>;
}

export function MobileFirstLayout({
  children,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  activePage,
  setActivePage,
  navigationItems
}: MobileFirstLayoutProps) {
  const { user, logout } = useAuth();

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => {
          setActivePage(item.label);
          if (isMobile) {
            setSidebarOpen(false);
          }
        }}
        className={`dark-nav-item w-full text-left ${
          isActive ? "dark-nav-item-active" : ""
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? "text-dark-primary" : "text-dark-secondary"}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    const group = item.group || 'Main';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <div className="flex h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-primary">ProjectorCare</h1>
              <p className="text-xs text-dark-secondary">Warranty Management</p>
            </div>
          </div>
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="text-dark-secondary hover:text-dark-primary"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out' : 'w-72'} bg-dark-bg border-r border-dark-color flex flex-col ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}>
        {/* Logo */}
        <div className={`${isMobile ? 'pt-20' : ''} p-8 border-b border-dark-color`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center dark-shadow-lg relative overflow-hidden">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-primary">ProjectorCare</h1>
              <p className="text-xs text-dark-secondary font-medium">Warranty Management System</p>
            </div>
          </div>
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-dark-secondary" />
                <span className="text-sm text-dark-secondary">
                  {user?.profile?.firstName || user?.username}
                </span>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-dark-secondary hover:text-dark-primary"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto mobile-scroll">
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <div key={groupName} className="space-y-4">
              <div className="px-4">
                <h3 className="text-xs font-bold text-dark-secondary uppercase tracking-widest">{groupName}</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => renderNavItem(item, activePage === item.label))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative ${isMobile ? 'ml-0' : ''}`}>
        <div className={`flex-1 overflow-y-auto mobile-scroll ${isMobile ? 'pt-20' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
