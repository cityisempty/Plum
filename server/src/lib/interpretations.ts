import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export type Interpretation = {
  code: string;
  title: string;
  summary: string;
  psychology: string;
  audience: string;
  imagery: string;
  missing: boolean;
};

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/interpretations.json");
const all = JSON.parse(readFileSync(file, "utf8")) as Record<string, Interpretation>;

export function getInterpretation(codeStr: string): Interpretation {
  const item = all[codeStr];
  if (!item) {
    return {
      code: codeStr,
      title: "（待补）",
      summary: "",
      psychology: "",
      audience: "",
      imagery: "",
      missing: true,
    };
  }
  return item;
}

export const interpretationCount = Object.keys(all).length;
