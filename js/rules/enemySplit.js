/**
 * 責務: 次のターンに持ち越す攻撃のユニット（子。スライムの子スライム）を持つ敵の純粋な計算（生まれる数・相殺と城の被害のうち子の分・予告への子の数の付け方・中断データの形の確かめ）。
 * 何も import しない（ルール層）。
 */

/**
 * 与えたダメージから、生まれる子の数を求める。
 * 式は `Math.floor((dealt * percent + 99) / 100)`（整数だけの切り上げ。浮動小数の誤差を避ける）。上限・ステージの加算・疲弊はない。
 * 例（30%）: 0 → 0、1 → 1、3 → 1、4 → 2、10 → 3、11 → 4。
 * @param {{ percent: number }|null|undefined} split 分裂の設定（`null`・`undefined` は子を持たない）
 * @param {number} dealt その攻防で敵の HP が実際に減った量（`enemyDamage` の量。残りの HP で頭打ちの値）
 * @returns {number} 生まれる子の数（0 以上の整数。`split` がない・`dealt` が 0 以下なら 0）
 */
export function minionBirths(split, dealt) {
  if (!split || dealt <= 0) return 0;
  return Math.floor((dealt * split.percent + 99) / 100);
}

/**
 * 襲う子のうち、盾の兵での相殺と城の被害の子の分を求める。
 * 盾の兵に当たる順は「子が先」（子が先に盾の兵と相打ちになり、残った盾の兵が敵自身の攻撃を受ける。城の被害も子の分が先）。
 * 合計の `blocked`・`damage` は呼ぶ側が今の式で求めた値で、子の分はその一部（子の分 ≤ 合計）。
 * @param {number} minions 襲う子の数
 * @param {number} blocked 盾の兵での相殺の合計
 * @param {number} damage 城の被害の合計
 * @returns {{ blocked: number, damage: number }} 子の分の相殺と城の被害
 */
export function minionShares(minions, blocked, damage) {
  const shareBlocked = Math.min(blocked, minions);
  const shareDamage = Math.min(minions - shareBlocked, damage);
  return { blocked: shareBlocked, damage: shareDamage };
}

/**
 * 予告に、襲う子の数を付ける。子を持つ敵（設定に `split` がある）だけ付け、持たない敵の予告はそのまま返す。
 * @param {{ split?: object }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyIntent} intent 予告
 * @param {number|undefined} minions 敵の待っている子の数（`undefined` は 0 とみなす）
 * @returns {import('./combatants.js').EnemyIntent} 子を持つ敵は `minions` を足した新しい予告、持たない敵は `intent` そのまま
 */
export function intentWithMinions(spec, intent, minions) {
  if (!spec.split) return intent;
  return { ...intent, minions: minions ?? 0 };
}

/**
 * 中断データの敵の子の数と予告の `minions` の形が正しいか（どんな値でも例外を投げない）。
 * 子を持たない敵は `minions === 0` かつ予告に `minions` がない。
 * 子を持つ敵は `minions` が 0 以上の整数で、予告の `minions` は無いか 0 以上の整数（3択の段階では敵の値と違ってよいので等しさは見ない）。
 * @param {{ split?: object }} spec 敵の種類の設定
 * @param {unknown} minions 敵の子の数
 * @param {unknown} intent 予告（プレーンなオブジェクトでなければ予告の項目は無いものとして見る）
 * @returns {boolean} 形が合えば true
 */
export function isEnemyMinionsShape(spec, minions, intent) {
  const intentMinions =
    typeof intent === 'object' && intent !== null ? /** @type {{ minions?: unknown }} */ (intent).minions : undefined;
  if (!spec.split) return minions === 0 && intentMinions === undefined;
  const isCount = (/** @type {unknown} */ v) => Number.isInteger(v) && /** @type {number} */ (v) >= 0;
  return isCount(minions) && (intentMinions === undefined || isCount(intentMinions));
}
