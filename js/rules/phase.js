/**
 * 責務: フェーズの頭のゲージの戻しと力こぶの換算（行動回数の決定）を求める純粋な計算。
 */

/**
 * フェーズの頭の計算結果。
 * @typedef {Object} PhaseStart
 * @property {Object<string, number>} gauges 新しいゲージ（`config.gauges` の順。残すゲージ以外は0、力こぶは換算分を引いた値）
 * @property {number} bonusActions 力こぶの換算で増える行動回数
 * @property {number} muscleSpent 換算で使った力こぶの量
 * @property {number} actions このフェーズの行動回数（基本 + 増加分）
 */

/**
 * 今のゲージから、次のフェーズの頭のゲージと行動回数を求める。引数は書き換えない。
 * @param {Object<string, number>} gauges 今のゲージ
 * @param {{ gauges: readonly string[], keptGauges: readonly string[], baseActions: number, muscleConversion: { gauge: string, per: number, maxBonus: number } }} config ルールの設定
 * @returns {PhaseStart} 計算結果
 */
export function computePhaseStart(gauges, config) {
  const { gauge, per, maxBonus } = config.muscleConversion;
  const bonusActions = Math.min(Math.floor((gauges[gauge] ?? 0) / per), maxBonus);
  const muscleSpent = bonusActions * per;

  /** @type {Object<string, number>} */
  const next = {};
  for (const key of config.gauges) {
    next[key] = config.keptGauges.includes(key) ? (gauges[key] ?? 0) : 0;
  }
  next[gauge] = (next[gauge] ?? 0) - muscleSpent;

  return {
    gauges: next,
    bonusActions,
    muscleSpent,
    actions: config.baseActions + bonusActions,
  };
}
