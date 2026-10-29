import type { State } from "@/lib/store";
import type { Dict } from "@/lib/i18n";

/** Changes the shop's data: `fn` edits a draft copy, which is then saved (database or this browser) */
export type Update = (fn: (s: State) => void) => void;
/** What every tab receives from the Dashboard */
export interface ViewProps { s: State; t: Dict; update: Update }
