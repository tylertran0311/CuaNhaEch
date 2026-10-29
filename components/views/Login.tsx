"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button, FormCard, FormError, Panel, TextInput } from "@/components/ui";
import type { Dict } from "@/lib/i18n";

/** Email + password sign-in to the shop's database */
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
    <Panel className="login" title={t.loginT}>
      <FormCard onSubmit={submit}>
        <TextInput type="email" autoComplete="username" required placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput type="password" autoComplete="current-password" required placeholder={t.password} value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button variant="primary" type="submit" disabled={busy}>{t.loginB}</Button>
      </FormCard>
      <FormError>{err}</FormError>
    </Panel>
  );
}
