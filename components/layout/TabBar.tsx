/** Main tab bar: pill buttons, the current one pressed in; `counts` adds a number badge (e.g. requests waiting) */
export default function TabBar<T extends string>({ tabs, labels, value, onChange, counts }: {
  tabs: readonly T[]; labels: readonly string[]; value: T; onChange: (v: T) => void; counts?: Partial<Record<T, number>>;
}) {
  return (
    <nav>
      {tabs.map((k, i) => {
        const n = counts?.[k] ?? 0;
        return (
          <button key={k} className={k === value ? "on" : ""} aria-current={k === value ? "page" : undefined} onClick={() => onChange(k)}>
            {labels[i]}{n > 0 && <span className="tab-n" aria-label={`(${n})`}>{n > 99 ? "99+" : n}</span>}
          </button>
        );
      })}
    </nav>
  );
}
