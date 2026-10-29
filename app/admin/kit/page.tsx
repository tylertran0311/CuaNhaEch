"use client";

// Living style guide: every UI kit component with sample data. Add an example here whenever the kit grows.
import { useState } from "react";
import {
  Button, LinkButton, Chip, Combobox, CopyBtn, DatePicker, Empty, FormCard, FormError, IconButton, Money, Note, Panel, Segmented,
  Select, Stat, Stats, TextArea, TextInput, TimePicker, Toast, ToggleChip, Toolbar, TwoCols, UnitInput, useConfirm,
} from "@/components/ui";
import { T } from "@/lib/i18n";

const t = T.vi;
const TOKENS = ["--ink", "--mut", "--wh", "--pk", "--pk2", "--lil", "--aq", "--sun", "--co", "--sky", "--red", "--grn", "--peach", "--mint", "--lime", "--lav"];

export default function KitPage() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [pick, setPick] = useState("Facebook");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState<"vi" | "en">("vi");
  const [money, setMoney] = useState("");
  const [toast, setToast] = useState(0);
  const [node, ask] = useConfirm();
  const [answer, setAnswer] = useState("");

  return (
    <div className="wrap">
      {node}
      <Toolbar title="🧩 UI kit" meta="docs/design-system.md">
        <Segmented options={["vi", "en"] as const} value={seg} onChange={setSeg} label={(v) => v.toUpperCase()} />
      </Toolbar>
      <Note>Mọi trang đều ghép từ các phần dưới đây. Thiếu gì thì thêm biến thể vào kit, đừng tạo component riêng.</Note>

      <Panel title="Tokens">
        <div className="fbtns">
          {TOKENS.map((v) => (
            <span key={v} className="ch" style={{ background: `var(${v})`, color: v === "--ink" ? "var(--wh)" : undefined }}>{v}</span>
          ))}
        </div>
      </Panel>

      <Stats>
        <Stat label="Stat" value="12.300.000 ₫" tone="in" sub="tone in" />
        <Stat label="Stat" value="2.100.000 ₫" tone="out" />
        <Stat label="Stat" value="42" />
        <Stat label="Stat" value="7" />
      </Stats>

      <TwoCols>
        <Panel title="Buttons">
          <div className="fbtns">
            <Button variant="primary">Primary</Button>
            <Button>Ghost</Button>
            <Button on>Ghost on</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Xóa">✕</IconButton>
            <LinkButton href="/home">🏠 LinkButton</LinkButton>
          </div>
          <p className="sub mt-12">Copy: 0901 234 567 <CopyBtn text="0901 234 567" label="Copy" /></p>
          {/* <Chips> keeps chips on one line next to text; this demo row wraps instead */}
          <div className="fbtns">
            <Chip kind="channel">Zalo</Chip><Chip kind="crab">Cua</Chip><Chip kind="shrimp">Tôm</Chip>
            <Chip kind="steam">🔥 Hấp</Chip><Chip kind="raw">🦀 Sống</Chip><Chip kind="live">📺 Live</Chip><Chip kind="late">Quá hạn</Chip>
          </div>
        </Panel>

        <Panel title="Feedback">
          <div className="fbtns">
            <Button onClick={async () => setAnswer((await ask({ title: "Xóa đơn này?", body: "Ví dụ popup xác nhận.", ok: "Xóa", cancel: "Thôi", danger: true })) ? "Đồng ý" : "Thôi")}>
              useConfirm
            </Button>
            <Button onClick={() => setToast((n) => n + 1)}>Toast</Button>
            {answer && <span className="sg">→ {answer}</span>}
          </div>
          <Note bad>Note bad</Note>
          <Empty>Empty</Empty>
        </Panel>
      </TwoCols>

      <Panel title="Form">
        <FormCard onSubmit={(e) => e.preventDefault()}>
          <Select value={pick} onChange={setPick} options={["Facebook", "Zalo", "TikTok"]} label="Select" />
          <Combobox placeholder="Combobox" value={name} onChange={setName} options={[{ value: "Chị Lan", hint: "0901 234 567" }, { value: "Anh Minh" }]} />
          <TextInput placeholder="TextInput" value={text} onChange={(e) => setText(e.target.value)} />
          <TextInput placeholder="TextInput bad" bad />
          <DatePicker className="dt" label={t.dDate} value={date} onChange={setDate} t={t} clearable />
          <TimePicker className="dt" label={t.dTime} value={time} onChange={setTime} t={t} />
          <div className="opts"><ToggleChip checked={on} onChange={setOn}>ToggleChip</ToggleChip></div>
          <UnitInput placeholder="UnitInput" suffix="kg" value="" onChange={() => {}} />
          <Money placeholder="Money" value={money} onChange={setMoney} />
          <div className="notef"><TextArea rows={2} placeholder="TextArea" /></div>
          <Button variant="primary" type="submit">Submit</Button>
        </FormCard>
        <FormError below>FormError: Bạn chưa nhập: Tên khách</FormError>
      </Panel>

      {toast > 0 && <Toast key={toast} action="↩ Hoàn tác" onAction={() => setToast(0)} onDone={() => setToast(0)}>🗑 Đã xóa đơn của Chị Lan</Toast>}
    </div>
  );
}
