/**
 * 責務: 遊び方の本文の印（折り返してよい位置 `|`・色を付ける言葉 `{種類:言葉}`）を読み取り、幅に合わせて行に割り付け（句読点の後と `|` でだけ折り返す・行頭禁止・ぶら下げ）、色の付いた行を描く。
 * 状態を持たない。
 */

/**
 * 行頭に置いてはいけない文字。
 * @type {ReadonlySet<string>}
 */
export const NO_LINE_START = Object.freeze(new Set(['、', '。', '）', '」', '！', '？']));

/**
 * 直後で折り返してよい文字。
 * @type {ReadonlySet<string>}
 */
export const BREAK_AFTER = Object.freeze(new Set(['、', '。', '！', '？', '）']));

/**
 * 本文の見た目。
 * @typedef {Object} RichTextStyle
 * @property {string} font 地の文のフォント。
 * @property {string} toneFont 色を付けた言葉のフォント。
 * @property {string} color 地の文の色。
 * @property {Readonly<Record<string, string>>} toneColors 色の種類 → 色（ここにない種類は印の誤りとして Error）。
 */

/**
 * 行の中の、同じ色の種類が続くひと続き。
 * @typedef {{ text: string, tone: string|null, w: number }} RichRun
 */

/**
 * 割り付けた1行（w は行の幅）。
 * @typedef {{ runs: RichRun[], w: number }} RichLine
 */

/**
 * 1文字（割り付けの単位）。
 * @typedef {{ text: string, tone: string|null, w: number }} Glyph
 */

/**
 * 印を読み取り、折り返してよい位置で区切った字の並び（かたまり）の並びにする。幅はまだ 0。
 * @param {string} text 段落（印つき）
 * @param {Readonly<Record<string, string>>} toneColors 色の種類 → 色（種類の名前の検査に使う）
 * @returns {Glyph[][]} かたまりの並び
 * @throws {Error} 印の誤りのとき
 */
function parseChunks(text, toneColors) {
  /** @type {Glyph[][]} */
  const chunks = [];
  /** @type {Glyph[]} */
  let current = [];
  let breakPending = false;

  /**
   * 字を1つ足す。
   * @param {string} ch 字
   * @param {string|null} tone 色の種類
   * @returns {void}
   */
  const add = (ch, tone) => {
    if (breakPending && !NO_LINE_START.has(ch) && current.length > 0) {
      chunks.push(current);
      current = [];
    }
    if (!NO_LINE_START.has(ch)) breakPending = false;
    current.push({ text: ch, tone, w: 0 });
    if (BREAK_AFTER.has(ch)) breakPending = true;
  };

  const chars = Array.from(text);
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === '|') {
      breakPending = true;
      i += 1;
    } else if (ch === '{') {
      const colon = chars.indexOf(':', i + 1);
      const close = chars.indexOf('}', i + 1);
      if (colon < 0 || close < 0 || colon > close) {
        throw new Error(`howToRichText: '{' の印が閉じていない（${text}）`);
      }
      const tone = chars.slice(i + 1, colon).join('');
      const word = chars.slice(colon + 1, close);
      if (word.length === 0) throw new Error(`howToRichText: 色を付ける言葉が空（${text}）`);
      if (!Object.prototype.hasOwnProperty.call(toneColors, tone)) {
        throw new Error(`howToRichText: 未知の色の種類 '${tone}'（${text}）`);
      }
      if (word.includes('|') || word.includes('{')) {
        throw new Error(`howToRichText: {} の中に '|' や '{' は書けない（${text}）`);
      }
      for (const w of word) add(w, tone);
      i = close + 1;
    } else if (ch === '}') {
      throw new Error(`howToRichText: 対応する '{' がない '}'（${text}）`);
    } else {
      add(ch, null);
      i += 1;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * 字の幅を測って入れる。ctx.font は呼び出し側が save/restore で囲む。
 * @param {CanvasRenderingContext2D} ctx 文字の幅を測る描画先
 * @param {Glyph[][]} chunks かたまりの並び（字の w を書き込む）
 * @param {RichTextStyle} style 本文の見た目
 * @returns {void}
 */
function measureGlyphs(ctx, chunks, style) {
  /** @type {string|null} */
  let currentFont = null;
  for (const chunk of chunks) {
    for (const g of chunk) {
      const font = g.tone === null ? style.font : style.toneFont;
      if (font !== currentFont) {
        ctx.font = font;
        currentFont = font;
      }
      g.w = ctx.measureText(g.text).width;
    }
  }
}

/**
 * 字の並びの幅の和を返す。
 * @param {Glyph[]} glyphs 字の並び
 * @returns {number} 幅の和
 */
function sumWidth(glyphs) {
  let w = 0;
  for (const g of glyphs) w += g.w;
  return w;
}

/**
 * かたまりの末尾から続く、行頭禁止または直後で折り返してよい字の幅の和（ぶら下げてよい幅）を返す。
 * @param {Glyph[]} chunk かたまり
 * @returns {number} 末尾の幅
 */
function tailWidth(chunk) {
  let w = 0;
  for (let i = chunk.length - 1; i >= 0; i -= 1) {
    const t = chunk[i].text;
    if (!NO_LINE_START.has(t) && !BREAK_AFTER.has(t)) break;
    w += chunk[i].w;
  }
  return w;
}

/**
 * かたまりを「行頭禁止でない字＋その後に続く行頭禁止の字」の組に分ける。
 * @param {Glyph[]} chunk かたまり
 * @returns {Glyph[][]} 組の並び
 */
function splitUnits(chunk) {
  /** @type {Glyph[][]} */
  const units = [];
  for (const g of chunk) {
    if (NO_LINE_START.has(g.text) && units.length > 0) units[units.length - 1].push(g);
    else units.push([g]);
  }
  return units;
}

/**
 * 字の並びを、同じ色の種類が続くひと続きにまとめて1行にする。
 * @param {Glyph[]} glyphs 行の字の並び
 * @returns {RichLine} 1行
 */
function toLine(glyphs) {
  /** @type {RichRun[]} */
  const runs = [];
  let lineW = 0;
  for (const g of glyphs) {
    const last = runs[runs.length - 1];
    if (last !== undefined && last.tone === g.tone) {
      last.text += g.text;
      last.w += g.w;
    } else {
      runs.push({ text: g.text, tone: g.tone, w: g.w });
    }
    lineW += g.w;
  }
  return { runs, w: lineW };
}

/**
 * 段落（印つき）を幅 maxW に割り付けた行の並びを返す。ctx のフォントは中で save/restore する。
 * 折り返すのは、かたまりの切れ目だけ（1行に収まらないかたまりに限り1文字単位）。
 * @param {CanvasRenderingContext2D} ctx 文字の幅を測る描画先
 * @param {string} text 段落（印つき）
 * @param {number} maxW 1行の最大の幅
 * @param {number} hangW 行末にぶら下げてよい幅
 * @param {RichTextStyle} style 本文の見た目
 * @returns {RichLine[]} 割り付けた行の並び
 * @throws {Error} 印の誤りのとき
 */
export function wrapRichText(ctx, text, maxW, hangW, style) {
  const chunks = parseChunks(text, style.toneColors);
  ctx.save();
  measureGlyphs(ctx, chunks, style);
  ctx.restore();

  /** @type {RichLine[]} */
  const lines = [];
  /** @type {Glyph[]} */
  let line = [];
  let lineW = 0;

  /**
   * 作りかけの行を確定して行の並びに足し、次の行を空にする。
   * @returns {void}
   */
  const commit = () => {
    lines.push(toLine(line));
    line = [];
    lineW = 0;
  };

  for (const chunk of chunks) {
    const w = sumWidth(chunk);
    const tailW = tailWidth(chunk);
    if (w - tailW > maxW || w > maxW + hangW) {
      // 1行に収まらないかたまり: 1文字単位（組ごと）で割り付ける。
      if (line.length > 0) commit();
      for (const unit of splitUnits(chunk)) {
        const unitW = sumWidth(unit);
        if (line.length === 0 || lineW + unitW <= maxW) {
          line.push(...unit);
          lineW += unitW;
          continue;
        }
        if (lineW + unit[0].w <= maxW && lineW + unitW <= maxW + hangW) {
          line.push(...unit);
          lineW += unitW;
          continue;
        }
        commit();
        line.push(...unit);
        lineW = unitW;
      }
      continue;
    }
    if (line.length === 0 || lineW + w <= maxW) {
      line.push(...chunk);
      lineW += w;
    } else if (lineW + w - tailW <= maxW && lineW + w <= maxW + hangW) {
      line.push(...chunk);
      lineW += w;
    } else {
      commit();
      line.push(...chunk);
      lineW = w;
    }
  }
  if (line.length > 0) commit();
  return lines;
}

/**
 * 行の並びを、左端 x、1行目の上端 top から行の高さ lineH ごとに描く。
 * 各行の中心 y は top + lineH × (i + 0.5)。左寄せ・textBaseline 'middle'。ひと続きごとに font・色を変え、x を run.w ずつ進める。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {RichLine[]} lines wrapRichText が返した行の並び
 * @param {number} x 左端
 * @param {number} top 1行目の上端
 * @param {number} lineH 行の高さ
 * @param {RichTextStyle} style 本文の見た目
 * @returns {void}
 */
export function drawRichLines(ctx, lines, x, top, lineH, style) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i += 1) {
    const y = top + lineH * (i + 0.5);
    let cx = x;
    for (const run of lines[i].runs) {
      ctx.font = run.tone === null ? style.font : style.toneFont;
      ctx.fillStyle = run.tone === null ? style.color : style.toneColors[run.tone];
      ctx.fillText(run.text, cx, y);
      cx += run.w;
    }
  }
  ctx.restore();
}
