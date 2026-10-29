"use client";

import { useEffect, useRef } from "react";

/** Pointer-based drag between columns; works with mouse and with the ⠿ grip on touch. */
export function useBoardDrag(onDrop: (id: number, stage: number) => void) {
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  useEffect(() => {
    let drag: { id: number; el: HTMLElement; x: number; y: number; on: boolean; g: HTMLElement | null } | null = null;
    const colAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>(".col") ?? null;
    const clearOver = () => document.querySelectorAll(".col.over").forEach((c) => c.classList.remove("over"));

    const down = (e: PointerEvent) => {
      const tg = e.target as Element;
      const c = tg.closest<HTMLElement>(".card");
      if (!c || tg.closest("button")) return;
      if (e.pointerType === "touch" && !tg.closest(".grip")) return;
      drag = { id: +c.dataset.id!, el: c, x: e.clientX, y: e.clientY, on: false, g: null };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (!drag.on) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
        drag.on = true;
        const g = drag.el.cloneNode(true) as HTMLElement;
        g.className = "card ghostc";
        g.style.width = drag.el.offsetWidth + "px";
        document.body.appendChild(g);
        drag.g = g;
        drag.el.style.opacity = ".35";
      }
      const g = drag.g!;
      g.style.left = e.clientX - g.offsetWidth / 2 + "px";
      g.style.top = e.clientY - 24 + "px";
      if (e.clientY < 90) window.scrollBy(0, -14);
      else if (e.clientY > innerHeight - 90) window.scrollBy(0, 14);
      clearOver();
      colAt(e.clientX, e.clientY)?.classList.add("over");
    };
    const end = (e: PointerEvent, drop: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      d.g?.remove();
      d.el.style.opacity = "";
      clearOver();
      const col = drop ? colAt(e.clientX, e.clientY) : null;
      if (col) dropRef.current(d.id, +col.dataset.stage!);
    };
    const up = (e: PointerEvent) => end(e, true);
    const cancel = (e: PointerEvent) => end(e, false);

    document.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
    };
  }, []);
}
