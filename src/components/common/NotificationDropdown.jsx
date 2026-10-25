import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDropdown({ onSelectDissertation = null }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!window.api || !user) return;
    try {
      const list = await window.api.getNotifications();
      const count = await window.api.getUnreadNotificationsCount();
      setNotifications(list || []);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!window.api) return;
    await window.api.markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const handleNotificationClick = async (notif) => {
    if (!window.api) return;
    if (!notif.is_read) {
      await window.api.markNotificationAsRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.link_id && onSelectDissertation) {
      onSelectDissertation(notif.link_id);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-600 rounded-full animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-ayush-600 dark:text-ayush-400 hover:underline flex items-center"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => {
                let Icon = Info;
                let iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/40';
                if (notif.type === 'success') {
                  Icon = CheckCircle2;
                  iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
                } else if (notif.type === 'danger') {
                  Icon = AlertCircle;
                  iconColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/40';
                } else if (notif.type === 'warning') {
                  Icon = AlertTriangle;
                  iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                      notif.is_read
                        ? 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'bg-ayush-50/40 dark:bg-ayush-950/20 hover:bg-ayush-50/70 dark:hover:bg-ayush-950/40'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-ayush-500 flex-shrink-0 ml-1.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
