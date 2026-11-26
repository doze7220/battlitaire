/**
 * 責務: 点の項目の計算の表 `SCORE_RULES` と、倒した敵の内訳（項目ごとの点と合計）を求める純粋な計算。
 * 項目の並びは `config.scoreItems` の書いた順。文字や表示は持たない。
 */

/**
 * 点の計算に渡す文脈。
 * @typedef {Object} ScoreContext
 * @property {number} stageNumber 倒した敵のステージの番号（1 から）。
 * @property {number} star 倒した敵の★。
 * @property {import('./battleRecord.js').BattleRecord} record その敵との戦闘の記録。
 */

/**
 * 倒した敵の内訳。
 * @typedef {Object} ScoreBreakdown
 * @property {Array<{id: string, points: number}>} items 項目ごとの点（`scoreItemIds` の順。0 点も入る）。
 * @property {number} total 点の合計。
 */

/**
 * 敵を倒した攻防の結果に載せる点（内訳に、足した後のスコアを足したもの）。
 * @typedef {Object} DefeatScore
 * @property {Array<{id: string, points: number}>} items 項目ごとの点（`scoreItemIds` の順。0 点も入る。写し）。
 * @property {number} total その敵の点の合計。
 * @property {number} after その敵の点を足した後のスコア。
 */

/**
 * 点の項目の計算の行。
 * @typedef {Object} ScoreRule
 * @property {(spec: any, context: ScoreContext) => number} points 設定と文脈から点を出す。
 */

/**
 * 点の項目の計算の表（キーは `config.scoreItems` と同じ識別子）。
 * @type {Readonly<Object<string, Readonly<ScoreRule>>>}
 */
export const SCORE_RULES = Object.freeze({
  /** 討伐: base + (ステージの番号 − 1) × perStage */
  defeat: Object.freeze({
    points: (spec, context) => spec.base + (context.stageNumber - 1) * spec.perStage,
  }),
  /** 強敵: byStar[star]（表にない★は 0） */
  strong: Object.freeze({
    points: (spec, context) => spec.byStar[context.star] ?? 0,
  }),
  /** ターン: max(min, base − perTurn × 使ったターン数) */
  turns: Object.freeze({
    points: (spec, context) => Math.max(spec.min, spec.base - spec.perTurn * context.record.turns),
  }),
  /** コンボ: 一番長い区切りが cards 枚以上なら points、そうでなければ 0 */
  combo: Object.freeze({
    points: (spec, context) => (context.record.longestRun >= spec.cards ? spec.points : 0),
  }),
  /** 無傷: 城が被害を受けていなければ points、受けていれば 0 */
  noDamage: Object.freeze({
    points: (spec, context) => (context.record.castleDamaged ? 0 : spec.points),
  }),
});

/**
 * 点の項目の識別子の並び（`config.scoreItems` の書いた順）。
 * @param {{scoreItems: Readonly<Object<string, unknown>>}} config ルールの設定
 * @returns {string[]} 識別子の並び
 */
export function scoreItemIds(config) {
  return Object.keys(config.scoreItems);
}

/**
 * 点の項目の識別子から計算の行を引く。
 * @param {string} id 点の項目の識別子
 * @returns {Readonly<ScoreRule>} 計算の行
 * @throws {Error} 表にない識別子のとき
 */
export function scoreRuleOf(id) {
  const rule = Object.hasOwn(SCORE_RULES, id) ? SCORE_RULES[id] : undefined;
  if (rule === undefined) throw new Error(`unknown score item: ${id}`);
  return rule;
}

/**
 * 倒した敵の内訳を求める（0 点の項目も並びに入れる。出さないのは画面の側）。
 * @param {{scoreItems: Readonly<Object<string, unknown>>}} config ルールの設定
 * @param {ScoreContext} context 倒した敵と戦闘の記録
 * @returns {ScoreBreakdown} 項目ごとの点と合計
 * @throws {Error} 表にない識別子の項目が設定にあるとき
 */
export function scoreDefeat(config, context) {
  const items = scoreItemIds(config).map((id) => ({
    id,
    points: scoreRuleOf(id).points(config.scoreItems[id], context),
  }));
  const total = items.reduce((sum, item) => sum + item.points, 0);
  return { items, total };
}
