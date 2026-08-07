import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationDTO,
} from "../../imports/Notifications";

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);

      setNotifications((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500">{unreadCount} unread</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleReadAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No notifications
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-5 rounded-xl border ${
                notification.is_read ? "bg-white" : "bg-blue-50"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {notification.title}
                  </h3>

                  <p className="mt-2 text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-sm text-gray-400">
                    {notification.time}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleRead(notification.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Read
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}