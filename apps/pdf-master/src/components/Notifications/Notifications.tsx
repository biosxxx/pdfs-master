import type { NotificationModel } from '@/domain/types';

interface NotificationsProps {
  notifications: NotificationModel[];
  onDismiss: (notificationId: string) => void;
}

export function Notifications({ notifications, onDismiss }: NotificationsProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
              {notification.description ? <p className="mt-1 text-sm text-slate-600">{notification.description}</p> : null}
            </div>
            <button
              type="button"
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
              onClick={() => onDismiss(notification.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
