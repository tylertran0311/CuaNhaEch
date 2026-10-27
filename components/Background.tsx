const STARS: { c: string; s: React.CSSProperties }[] = [
  { c: "✦", s: { left: "6%", top: "16%", fontSize: 22 } },
  { c: "♡", s: { left: "30%", top: "8%", fontSize: 16, animationDelay: "-1s" } },
  { c: "✧", s: { left: "60%", top: "20%", fontSize: 20, animationDelay: "-2s", color: "#9a84ff" } },
  { c: "★", s: { left: "92%", top: "40%", fontSize: 18, animationDelay: "-.5s" } },
  { c: "✧", s: { left: "4%", top: "55%", fontSize: 18, animationDelay: "-1.5s", color: "#3fc7b3" } },
  { c: "✦", s: { left: "48%", top: "62%", fontSize: 24, animationDelay: "-2.4s" } },
  { c: "★", s: { left: "80%", top: "75%", fontSize: 16, animationDelay: "-.8s", color: "#ffb300" } },
  { c: "♡", s: { left: "20%", top: "84%", fontSize: 20, animationDelay: "-1.9s", color: "#9a84ff" } },
];

const TICK = "✦ CUA NHÀ ẾCH ✦ CUA CÀ MAU CHÍNH GỐC ✦ CUA · TÔM ✦ ".repeat(3);

export default function Background() {
  return (
    <>
      <div className="fx" aria-hidden="true">
        <div className="sun" />
        {STARS.map((x, i) => <i key={i} style={x.s}>{x.c}</i>)}
      </div>
      <div className="tick" aria-hidden="true">
        <div className="tk"><span>{TICK}</span><span>{TICK}</span></div>
      </div>
    </>
  );
}
