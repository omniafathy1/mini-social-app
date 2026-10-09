import { useState } from "react";

const notificationMessages = {
  like: "أعجب بمنشورك",
  comment: "علّق على منشورك",
  follow: "بدأ بمتابعتك",
};

export const NotificationItem = ({ item, onRead, disabled }) => {
  const { isRead, id, type, createdAt, actor } = item;
  const name = actor?.name || "مستخدم";
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const date = new Date(createdAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("ar-EG");

  return (
    <button
      type="button"
      onClick={() => onRead(id)}
      disabled={disabled || isRead}
      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-right transition-colors disabled:cursor-wait ${
        isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/70 hover:bg-blue-50"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700 ring-1 ring-white">
        {actor?.avatarUrl && !hasAvatarError ? (
          <img
            src={actor.avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setHasAvatarError(true)}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-slate-700">
          <span className="font-bold text-slate-900">{name}</span>{" "}
          {notificationMessages[type] || "أرسل إليك إشعارًا"}
        </p>
        {formattedDate && (
          <time className="mt-1 block text-xs text-slate-400" dateTime={createdAt}>
            {formattedDate}
          </time>
        )}
      </div>
      {!isRead && (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"
          aria-label="غير مقروء"
        />
      )}
    </button>
  );
};