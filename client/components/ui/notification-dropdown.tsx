import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  BellRing, 
  Check, 
  Trash2, 
  Settings, 
  Plus,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlerts } from '@/contexts/alert-context';
import { useLanguage } from '@/contexts/language-context';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface NotificationDropdownProps {
  onSettingsClick?: () => void;
  className?: string;
}

export function NotificationDropdown({ onSettingsClick, className }: NotificationDropdownProps) {
  const { alerts, unreadCount, markAsRead, markAllAsRead, clearAlert } = useAlerts();
  const { t, language, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const formatTimeAgo = (timestamp: Date) => {
    try {
      return formatDistanceToNow(timestamp, { 
        addSuffix: true,
        locale: language === 'ar' ? ar : enUS
      });
    } catch {
      return language === 'ar' ? 'منذ قليل' : 'Just now';
    }
  };

  const getImportanceIcon = (importance: number) => {
    switch (importance) {
      case 3:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 2:
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 1:
        return <TrendingDown className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const recentAlerts = alerts.slice(0, 5); // Show only 5 most recent

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-9 w-9 px-0 relative", className)}
          data-tour-target="alerts"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t('nav.notifications')}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={dir === 'rtl' ? 'start' : 'end'} 
        className="w-80 max-h-[500px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4" />
            <span className="font-semibold">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                {t('notifications.mark_read')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="h-7 w-7 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-80 overflow-y-auto">
          {recentAlerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="py-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0",
                    !alert.isRead && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getImportanceIcon(alert.importance)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-medium leading-tight",
                        !alert.isRead && "font-semibold"
                      )}>
                        {alert.eventName}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAlert(alert.id);
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                      {!alert.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => setIsOpen(false)}
              >
                {language === 'ar' ? `عرض جميع الـ ${alerts.length} تنبيه` : `View all ${alerts.length} notifications`}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
