"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * The shop's own way into the dashboard from a public page, hidden from customers: `staff` is true only in a
 * browser already signed in (show a "Quản lý" link then), and `tapLogo` opens /admin after 5 taps in a row.
 */
export function useStaffEntry() {
  const router = useRouter();
  const [staff, setStaff] = useState(false);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    // Reads the session saved in this browser; no network call, nothing shown when signed out
    supabase?.auth.getSession().then(({ data }) => setStaff(!!data.session));
  }, []);

  function tapLogo() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) { taps.current = []; router.push("/admin"); }
  }
  return { staff, tapLogo };
}
