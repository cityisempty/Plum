#!/usr/bin/env node
/**
 * 扫描 docs/*.docx → server/src/data/interpretations.json
 * 文件名：NNNNN｜标题.docx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS = path.join(ROOT, "docs");
const OUT = path.join(ROOT, "server/src/data/interpretations.json");

function xmlText(xml) {
  const paras = [];
  const pBlocks = xml.split(/<w:p[\s>]/).slice(1);
  for (const block of pBlocks) {
    const texts = [...block.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
    const line = texts.join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
    if (line) paras.push(line);
  }
  return paras;
}

function sectionAfter(paras, heading, nextHeadings) {
  const idx = paras.findIndex((p) => p === heading || p.startsWith(heading));
  if (idx < 0) return "";
  const chunks = [];
  for (let i = idx + 1; i < paras.length; i++) {
    const p = paras[i];
    if (nextHeadings.some((h) => p === h || p.startsWith(h))) break;
    if (p.startsWith("|（注") || p.startsWith("| (注") || p.includes("部分内容可能由 AI")) continue;
    chunks.push(p);
  }
  return chunks.join("\n").trim();
}

function parseParas(paras, filenameTitle) {
  let title = filenameTitle;
  if (paras[0] && /｜/.test(paras[0])) {
    title = paras[0].replace(/^\d{5}｜/, "").trim() || filenameTitle;
  }

  let summary = "";
  const sumIdx = paras.findIndex((p) => p.startsWith("摘要"));
  if (sumIdx >= 0) {
    const line = paras[sumIdx];
    if (line.includes("：") || line.includes(":")) {
      summary = line.replace(/^摘要[：:]\s*/, "").trim();
    }
    if (!summary && paras[sumIdx + 1] && !["心理投射解读", "人群差异化提示", "物象觉察"].includes(paras[sumIdx + 1])) {
      summary = paras[sumIdx + 1].trim();
    }
  }

  const psychology = sectionAfter(paras, "心理投射解读", ["人群差异化提示", "物象觉察"]);
  const audience = sectionAfter(paras, "人群差异化提示", ["物象觉察"]);
  const imagery = sectionAfter(paras, "物象觉察", []);

  return { title, summary, psychology, audience, imagery };
}

const files = fs.readdirSync(DOCS).filter((f) => f.endsWith(".docx") && !f.startsWith("~"));
const byCode = new Map();
const warnings = [];

for (const f of files) {
  const m = f.match(/^(\d{5})｜(.+)\.docx$/);
  if (!m) {
    warnings.push(`skip name: ${f}`);
    continue;
  }
  const codeStr = m[1];
  const filenameTitle = m[2];
  const buf = fs.readFileSync(path.join(DOCS, f));
  let unzipped;
  try {
    unzipped = unzipSync(new Uint8Array(buf));
  } catch (e) {
    warnings.push(`unzip fail ${f}: ${e.message}`);
    continue;
  }
  const xmlU8 = unzipped["word/document.xml"];
  if (!xmlU8) {
    warnings.push(`no document.xml: ${f}`);
    continue;
  }
  const xml = new TextDecoder("utf-8").decode(xmlU8);
  const paras = xmlText(xml);
  const parsed = parseParas(paras, filenameTitle);
  if (byCode.has(codeStr)) {
    warnings.push(`duplicate ${codeStr}, keep first (${byCode.get(codeStr).title}), skip ${filenameTitle}`);
    continue;
  }
  byCode.set(codeStr, {
    code: codeStr,
    title: parsed.title,
    summary: parsed.summary,
    psychology: parsed.psychology,
    audience: parsed.audience,
    imagery: parsed.imagery,
    missing: false,
  });
}

const result = {};
let complete = 0;
let missing = 0;
for (let i = 1; i <= 384; i++) {
  const codeStr = String(i).padStart(5, "0");
  if (byCode.has(codeStr)) {
    result[codeStr] = byCode.get(codeStr);
    complete++;
  } else {
    result[codeStr] = {
      code: codeStr,
      title: "（待补）",
      summary: "",
      psychology: "",
      audience: "",
      imagery: "",
      missing: true,
    };
    missing++;
    warnings.push(`missing ${codeStr}`);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");

console.log(`wrote ${OUT}`);
console.log(`complete=${complete} missing=${missing} files=${files.length}`);
for (const w of warnings) console.log("warn:", w);
