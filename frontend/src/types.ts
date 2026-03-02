import type { ChangeEvent } from "react";

export type CE = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type ToastType = { msg: string; type: "success" | "error"; key: number } | null;
