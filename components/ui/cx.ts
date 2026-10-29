/** Joins class names, skipping empty ones: cx("btn", on && "on", className) */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
