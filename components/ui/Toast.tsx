"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Message at the bottom of the screen with one action (e.g. "Deleted · Undo"). It closes itself after
 * `duration` ms, with a bar showing the time left. Give it a new `key` to restart it for a new message.
 */
export function Toast({ children, action, onAction, duration = 8000, onDone }: {
  children: ReactNode; action?: ReactNode; onAction?: () => void; duration?: number; onDone: () => void;
}) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const id = setTimeout(() => done.current(), duration);
    return () => clearTimeout(id);
  }, [duration]);
  return (
    <div className="toast" role="status">
      <span>{children}</span>
      {action && <button type="button" className="ghost" onClick={onAction}>{action}</button>}
      <i className="toast-bar" style={{ animationDuration: duration + "ms" }} />
    </div>
  );
}
