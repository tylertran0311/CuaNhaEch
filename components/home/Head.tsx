/** Section heading: small kicker, serif title, optional note on the right */
export default function Head({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div className="hm-h">
      <div>
        <p className="hm-kick">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {note && <p className="hm-h-note">{note}</p>}
    </div>
  );
}
