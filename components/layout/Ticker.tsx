const TICK = "✦ CUA NHÀ ẾCH ✦ CUA CÀ MAU CHÍNH GỐC ✦ CUA · TÔM ✦ ".repeat(3);

// The page background itself (yellow polka dots + faint crabs) is plain CSS on body; this is the scrolling ticker on top
export default function Ticker() {
  return (
    <div className="tick" aria-hidden="true">
      <div className="tk"><span>{TICK}</span><span>{TICK}</span></div>
    </div>
  );
}
