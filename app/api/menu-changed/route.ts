// Called by the dashboard after the menu or its prices change, so the public page shows them on the next visit.
import { revalidateTag } from "next/cache";
import { isMemberRequest } from "@/lib/serverAuth";
import { MENU_TAG } from "@/lib/publicMenu";

export async function POST(req: Request) {
  if (!(await isMemberRequest(req))) return Response.json({ ok: false }, { status: 401 });
  // expire: 0 → the next visitor gets fresh prices, not the old page while it refreshes
  revalidateTag(MENU_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
