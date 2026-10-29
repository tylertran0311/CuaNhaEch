/** Main tab bar: pill buttons, the current one pressed in */
export default function TabBar<T extends string>({ tabs, labels, value, onChange }: {
  tabs: readonly T[]; labels: readonly string[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <nav>
      {tabs.map((k, i) => (
        <button key={k} className={k === value ? "on" : ""} aria-current={k === value ? "page" : undefined} onClick={() => onChange(k)}>{labels[i]}</button>
      ))}
    </nav>
  );
}
