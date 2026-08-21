/**
 * 数字投射解码：6 位数字 → 384 爻编码
 * 规则来自《6位数字→384卦编码完整公式体系》
 *
 * 上卦 = 前三位 % 8 || 8
 * 下卦 = 后三位 % 8 || 8
 * 动爻 = 全数 % 6 || 6
 * 编码 = (卦序 - 1) * 6 + 动爻位   // 1..384
 */

export const BAGUA_NAMES = ["", "乾", "兑", "离", "震", "巽", "坎", "艮", "坤"] as const;
export const BAGUA_NATURE = ["", "天", "泽", "火", "雷", "风", "水", "山", "地"] as const;

/** 三爻从下到上：1 阳 0 阴 */
export const BAGUA_YAO: Record<number, [number, number, number]> = {
  1: [1, 1, 1], // 乾
  2: [1, 1, 0], // 兑
  3: [1, 0, 1], // 离
  4: [1, 0, 0], // 震
  5: [0, 1, 1], // 巽
  6: [0, 1, 0], // 坎
  7: [0, 0, 1], // 艮
  8: [0, 0, 0], // 坤
};

export type Hexagram = {
  order: number;
  name: string;
  upper: number;
  lower: number;
};

/** 序卦传 64 卦：上卦 × 下卦 → 本卦 */
export const HEXAGRAMS: Hexagram[] = [
  { order: 1, name: "乾为天", upper: 1, lower: 1 },
  { order: 2, name: "坤为地", upper: 8, lower: 8 },
  { order: 3, name: "水雷屯", upper: 6, lower: 4 },
  { order: 4, name: "山水蒙", upper: 7, lower: 6 },
  { order: 5, name: "水天需", upper: 6, lower: 1 },
  { order: 6, name: "天水讼", upper: 1, lower: 6 },
  { order: 7, name: "地水师", upper: 8, lower: 6 },
  { order: 8, name: "水地比", upper: 6, lower: 8 },
  { order: 9, name: "风天小畜", upper: 5, lower: 1 },
  { order: 10, name: "天泽履", upper: 1, lower: 2 },
  { order: 11, name: "地天泰", upper: 8, lower: 1 },
  { order: 12, name: "天地否", upper: 1, lower: 8 },
  { order: 13, name: "天火同人", upper: 1, lower: 3 },
  { order: 14, name: "火天大有", upper: 3, lower: 1 },
  { order: 15, name: "地山谦", upper: 8, lower: 7 },
  { order: 16, name: "雷地豫", upper: 4, lower: 8 },
  { order: 17, name: "泽雷随", upper: 2, lower: 4 },
  { order: 18, name: "山风蛊", upper: 7, lower: 5 },
  { order: 19, name: "地泽临", upper: 8, lower: 2 },
  { order: 20, name: "风地观", upper: 5, lower: 8 },
  { order: 21, name: "火雷噬嗑", upper: 3, lower: 4 },
  { order: 22, name: "山火贲", upper: 7, lower: 3 },
  { order: 23, name: "山地剥", upper: 7, lower: 8 },
  { order: 24, name: "地雷复", upper: 8, lower: 4 },
  { order: 25, name: "天雷无妄", upper: 1, lower: 4 },
  { order: 26, name: "山天大畜", upper: 7, lower: 1 },
  { order: 27, name: "山雷颐", upper: 7, lower: 4 },
  { order: 28, name: "泽风大过", upper: 2, lower: 5 },
  { order: 29, name: "坎为水", upper: 6, lower: 6 },
  { order: 30, name: "离为火", upper: 3, lower: 3 },
  { order: 31, name: "泽山咸", upper: 2, lower: 7 },
  { order: 32, name: "雷风恒", upper: 4, lower: 5 },
  { order: 33, name: "天山遁", upper: 1, lower: 7 },
  { order: 34, name: "雷天大壮", upper: 4, lower: 1 },
  { order: 35, name: "火地晋", upper: 3, lower: 8 },
  { order: 36, name: "地火明夷", upper: 8, lower: 3 },
  { order: 37, name: "风火家人", upper: 5, lower: 3 },
  { order: 38, name: "火泽睽", upper: 3, lower: 2 },
  { order: 39, name: "水山蹇", upper: 6, lower: 7 },
  { order: 40, name: "雷水解", upper: 4, lower: 6 },
  { order: 41, name: "山泽损", upper: 7, lower: 2 },
  { order: 42, name: "风雷益", upper: 5, lower: 4 },
  { order: 43, name: "泽天夬", upper: 2, lower: 1 },
  { order: 44, name: "天风姤", upper: 1, lower: 5 },
  { order: 45, name: "泽地萃", upper: 2, lower: 8 },
  { order: 46, name: "地风升", upper: 8, lower: 5 },
  { order: 47, name: "泽水困", upper: 2, lower: 6 },
  { order: 48, name: "水风井", upper: 6, lower: 5 },
  { order: 49, name: "泽火革", upper: 2, lower: 3 },
  { order: 50, name: "火风鼎", upper: 3, lower: 5 },
  { order: 51, name: "震为雷", upper: 4, lower: 4 },
  { order: 52, name: "艮为山", upper: 7, lower: 7 },
  { order: 53, name: "风山渐", upper: 5, lower: 7 },
  { order: 54, name: "雷泽归妹", upper: 4, lower: 2 },
  { order: 55, name: "雷火丰", upper: 4, lower: 3 },
  { order: 56, name: "火山旅", upper: 3, lower: 7 },
  { order: 57, name: "巽为风", upper: 5, lower: 5 },
  { order: 58, name: "兑为泽", upper: 2, lower: 2 },
  { order: 59, name: "风水涣", upper: 5, lower: 6 },
  { order: 60, name: "水泽节", upper: 6, lower: 2 },
  { order: 61, name: "风泽中孚", upper: 5, lower: 2 },
  { order: 62, name: "雷山小过", upper: 4, lower: 7 },
  { order: 63, name: "水火既济", upper: 6, lower: 3 },
  { order: 64, name: "火水未济", upper: 3, lower: 6 },
];

const HEX_BY_UP_DOWN = new Map<string, Hexagram>();
for (const h of HEXAGRAMS) HEX_BY_UP_DOWN.set(`${h.upper}_${h.lower}`, h);

export function yaoName(isYang: boolean, pos: number): string {
  const yinYang = isYang ? "九" : "六";
  if (pos === 1) return isYang ? "初九" : "初六";
  if (pos === 6) return isYang ? "上九" : "上六";
  const mid = ["二", "三", "四", "五"][pos - 2];
  return yinYang + mid;
}

export function sixYao(upper: number, lower: number): boolean[] {
  const d = BAGUA_YAO[lower];
  const u = BAGUA_YAO[upper];
  return [!!d[0], !!d[1], !!d[2], !!u[0], !!u[1], !!u[2]];
}

export type DivineResult = {
  input: string;
  upper: number;
  lower: number;
  upperName: string;
  lowerName: string;
  upperNature: string;
  lowerNature: string;
  hexagramOrder: number;
  hexagramName: string;
  movingLine: number;
  movingName: string;
  code: number;
  codeStr: string;
  range: [string, string];
  sixYao: boolean[];
  sixYaoNames: string[];
};

export function normalizeInput(raw: string | number): string {
  const s = String(raw).trim();
  if (!/^\d{1,6}$/.test(s)) {
    throw new Error("INVALID_NUMBER");
  }
  return s.padStart(6, "0");
}

export function divine(raw: string | number): DivineResult {
  const input = normalizeInput(raw);
  const abc = Number(input.slice(0, 3));
  const def = Number(input.slice(3, 6));
  const whole = Number(input);

  const upper = abc % 8 || 8;
  const lower = def % 8 || 8;
  const movingLine = whole % 6 || 6;

  const hex = HEX_BY_UP_DOWN.get(`${upper}_${lower}`);
  if (!hex) throw new Error("HEXAGRAM_NOT_FOUND");

  const yao = sixYao(upper, lower);
  const names = yao.map((yang, i) => yaoName(yang, i + 1));
  const code = (hex.order - 1) * 6 + movingLine;
  const start = (hex.order - 1) * 6 + 1;

  return {
    input,
    upper,
    lower,
    upperName: BAGUA_NAMES[upper],
    lowerName: BAGUA_NAMES[lower],
    upperNature: BAGUA_NATURE[upper],
    lowerNature: BAGUA_NATURE[lower],
    hexagramOrder: hex.order,
    hexagramName: hex.name,
    movingLine,
    movingName: names[movingLine - 1],
    code,
    codeStr: String(code).padStart(5, "0"),
    range: [String(start).padStart(5, "0"), String(start + 5).padStart(5, "0")],
    sixYao: yao,
    sixYaoNames: names,
  };
}

export const CJK_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

export function toCjkCount(n: number): string {
  if (n < 0) return String(n);
  if (n === 0) return "零";
  if (n < 10) return "零" + CJK_DIGITS[n]; // 零壹风格：个位数前衬零字，界面用「拾」另处理
  if (n === 10) return "十";
  if (n < 20) return "十" + CJK_DIGITS[n - 10];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return CJK_DIGITS[tens] + "十" + (ones ? CJK_DIGITS[ones] : "");
  }
  return String(n);
}

/** 点数钤印用：10 → 拾，11 → 拾壹 */
export function pointsSealText(n: number): string {
  const map: Record<number, string> = {
    0: "零",
    1: "壹",
    2: "贰",
    3: "叁",
    4: "肆",
    5: "伍",
    6: "陆",
    7: "柒",
    8: "捌",
    9: "玖",
    10: "拾",
  };
  if (n in map) return map[n];
  if (n > 10 && n < 20) return "拾" + map[n - 10];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return map[tens] + "拾" + (ones ? map[ones] : "");
  }
  return String(n);
}
