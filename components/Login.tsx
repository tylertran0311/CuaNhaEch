"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dict } from "@/lib/i18n";

export default function Login({ sb, t }: { sb: SupabaseClient; t: Dict }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr(t.loginErr);
  }

  return (
    <div className="panel login">
      <h2>{t.loginT}</h2>
      <form className="add" onSubmit={submit}>
        <input type="email" autoComplete="username" required placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" autoComplete="current-password" required placeholder={t.password} value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn" type="submit" disabled={busy}>{t.loginB}</button>
      </form>
      <div className="err" role="alert">{err}</div>
    </div>
  );
}
