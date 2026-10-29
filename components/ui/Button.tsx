import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The one button. `primary` = pink pill for the main action of a form, `ghost` = outlined pill for
 * everything else, `danger` = red pill for destructive confirmations. `on` marks a ghost as selected.
 */
export function Button({ variant = "ghost", on, className, type = "button", ...rest }: Props & {
  variant?: "primary" | "ghost" | "danger"; on?: boolean;
}) {
  const base = variant === "ghost" ? "ghost" : variant === "danger" ? "btn danger" : "btn";
  return <button type={type} className={cx(base, on && "on", className)} {...rest} />;
}

/** Square button the height of a field, holding only an icon; `label` is read out and shown on hover */
export function IconButton({ label, className, type = "button", ...rest }: Props & { label: string }) {
  return <button type={type} className={cx("lx", className)} aria-label={label} title={label} {...rest} />;
}

/** A link styled as a button (same variants as <Button>), for going to another page */
export function LinkButton({ variant = "ghost", className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const base = variant === "ghost" ? "ghost" : variant === "danger" ? "btn danger" : "btn";
  return <a className={cx(base, "btn-link", className)} {...rest} />;
}
