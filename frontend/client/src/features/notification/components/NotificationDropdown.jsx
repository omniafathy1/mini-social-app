import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

export const NotificationDropdown = () => {
  const {
    notifications,
    isLoading,
    isError,
    error,
    markAsReadMutation,
    unreadCount,
    markAllMutation,
  } = useNotifications(true);

  return (
    <section
      role="dialog"
      aria-label="الإشعارات"
      onClick={(event) => event.stopPropagation()}
      className="w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-2xl shadow-slate-300/50"
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="font-bold text-slate-900">الإشعارات</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} غير مقروء` : 'أنت مطّلع على كل شيء'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {markAsReadMutation.isError && (
        <div className="p-3 text-center text-sm text-red-600" role="alert">
          تعذر تحديث الإشعار. حاول مرة أخرى.
        </div>
      )}
      {markAllMutation.isError && (
        <div className="p-3 text-center text-sm text-red-600" role="alert">
          تعذر تحديث الإشعارات. حاول مرة أخرى.
        </div>
      )}

      <div className="max-h-[min(28rem,70vh)] overflow-y-auto bg-slate-50/40">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500" role="status">
            جاري تحميل الإشعارات...
          </p>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-red-600" role="alert">
            تعذر تحميل الإشعارات: {error?.message || 'حدث خطأ غير متوقع'}
          </p>
        ) : notifications?.length > 0 ? (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onRead={markAsReadMutation.mutate}
              disabled={markAsReadMutation.isPending}
            />
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              🔔
            </div>
            <p className="text-sm font-semibold text-slate-700">لا توجد إشعارات بعد</p>
            <p className="mt-1 text-xs text-slate-500">سنخبرك عندما يحدث شيء جديد.</p>
          </div>
        )}
      </div>
    </section>
  );
};