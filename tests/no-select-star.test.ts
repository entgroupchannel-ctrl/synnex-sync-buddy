import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TABLE = "synnex_products";

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !p.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

function findOffenders(): string[] {
  const offenders: string[] = [];

  for (const file of walk("src")) {
    const src = stripComments(readFileSync(file, "utf8"));

    const aliases = [
      ...src.matchAll(
        new RegExp(
          `(?:const|let)\\s+(\\w+)\\s*=\\s*\\(\\)\\s*=>\\s*[\\w.]*\\.from\\(\\s*["'\`]${TABLE}["'\`]`,
          "g",
        ),
      ),
    ].map((m) => m[1]);

    for (const m of src.matchAll(/\.select\(\s*["'`]\*["'`]/g)) {
      const idx = m.index ?? 0;
      const before = src.slice(Math.max(0, idx - 400), idx);

      const froms = [...before.matchAll(/\.from\(\s*["'`]([a-z_]+)["'`]\s*\)/g)];
      const nearestFrom = froms.length ? froms[froms.length - 1] : null;
      const aliasCall = aliases.length
        ? [...before.matchAll(new RegExp(`\\b(${aliases.join("|")})\\(\\)`, "g"))].pop()
        : null;

      const fromIdx = nearestFrom?.index ?? -1;
      const aliasIdx = aliasCall?.index ?? -1;
      const hit = aliasIdx > fromIdx ? true : fromIdx >= 0 && nearestFrom![1] === TABLE;

      if (hit) offenders.push(`${file}:${src.slice(0, idx).split("\n").length}`);
    }
  }
  return offenders;
}

describe('ห้ามใช้ select("*") กับตาราง synnex_products', () => {
  it("ไม่พบจุดที่ละเมิด", () => {
    expect(findOffenders()).toEqual([]);
  });
});

describe("ห้าม query คอลัมน์ต้นทุนจากโค้ดฝั่งเบราว์เซอร์", () => {
  it("ไม่มีไฟล์ .tsx ที่ select คอลัมน์ต้นทุน", () => {
    const bad = walk("src")
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) =>
        /\.select\([^)]*\b(cost_price|markup_override|markup_applied|b2b_markup_applied)\b/s.test(
          stripComments(readFileSync(f, "utf8")),
        ),
      );
    expect(bad).toEqual([]);
  });
});
