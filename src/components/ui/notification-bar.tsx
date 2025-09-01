import { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';
import { Button } from './button';

interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'error';
  timestamp: Date;
}

interface NotificationBarProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function NotificationBar({ notifications, onDismiss, onDismissAll }: NotificationBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const activeNotifications = notifications.filter(n => !dismissedNotifications.has(n.id));

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Notification Count and Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-400" />
              <span className="text-dark-primary font-medium">
                {activeNotifications.length} Warranty Alert{activeNotifications.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-dark-secondary hover:text-dark-primary"
              variant="ghost"
            >
              {isExpanded ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {/* Dismiss All Button */}
          {activeNotifications.length > 1 && (
            <Button
              onClick={onDismissAll}
              className="text-sm text-dark-secondary hover:text-dark-primary"
              variant="ghost"
            >
              Dismiss All
            </Button>
          )}
        </div>

        {/* Expanded Notifications */}
        {isExpanded && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {activeNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  notification.type === 'warning'
                    ? 'bg-orange-900/20 border-orange-500/30 text-orange-300'
                    : 'bg-red-900/20 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{notification.message}</span>
                </div>
                <Button
                  onClick={() => onDismiss(notification.id)}
                  className="text-dark-secondary hover:text-dark-primary ml-2"
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 