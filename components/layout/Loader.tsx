"use client";

import Image from "next/image";
import logo from "@/public/logo.png";

/** Full-screen splash while the shop's data loads; fades out once `done` */
export default function Loader({ text, done }: { text: string; done: boolean }) {
  const word = text.replace(/[.…]+$/, "");
  return (
    <div className={`loader${done ? " done" : ""}`} role="status" aria-live="polite" aria-hidden={done}>
      <div className="ld-crab">
        <Image className="ld-logo" src={logo} alt="" priority />
        <span className="ld-shadow" />
      </div>
      <div className="ld-txt" aria-label={text}>
        {[...word].map((c, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{c === " " ? " " : c}</span>
        ))}
        {[0, 1, 2].map((i) => <span key={"d" + i} className="ld-dot" style={{ animationDelay: `${i * 0.3}s` }}>.</span>)}
      </div>
    </div>
  );
}
