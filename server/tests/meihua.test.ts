import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { divine, HEXAGRAMS } from "../src/lib/meihua.js";

describe("divine", () => {
  it("140792 → 雷地豫 · 六二 · 00092", () => {
    const r = divine("140792");
    assert.equal(r.hexagramName, "雷地豫");
    assert.equal(r.hexagramOrder, 16);
    assert.equal(r.upperName, "震");
    assert.equal(r.lowerName, "坤");
    assert.equal(r.movingLine, 2);
    assert.equal(r.movingName, "六二");
    assert.equal(r.code, 92);
    assert.equal(r.codeStr, "00092");
    assert.deepEqual(r.range, ["00091", "00096"]);
  });

  it("艮为山 编码区间 00307–00312", () => {
    const gen = HEXAGRAMS.find((h) => h.name === "艮为山")!;
    assert.equal(gen.order, 52);
    assert.equal((gen.order - 1) * 6 + 1, 307);
    assert.equal(gen.order * 6, 312);
  });

  it("余 0 归坤 / 上爻", () => {
    const r = divine("888888");
    assert.equal(r.upperName, "坤");
    assert.equal(r.lowerName, "坤");
    assert.equal(r.hexagramName, "坤为地");
    assert.equal(r.movingLine, 6);
    assert.equal(r.codeStr, "00012");
  });

  it("覆盖 384 且无冲突", () => {
    const codes = new Set<number>();
    for (const h of HEXAGRAMS) {
      for (let p = 1; p <= 6; p++) codes.add((h.order - 1) * 6 + p);
    }
    assert.equal(HEXAGRAMS.length, 64);
    assert.equal(codes.size, 384);
    assert.equal(Math.min(...codes), 1);
    assert.equal(Math.max(...codes), 384);
  });
});
