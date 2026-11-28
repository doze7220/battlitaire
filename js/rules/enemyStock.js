/**
 * 責務: ターンをまたいで持ち越す敵の防御（溜め）の純粋な計算（持ち越すか・予告への溜めの付け方・攻撃に移した溜め・攻防の後の溜め）。
 * 何も import しない（ルール層）。
 */

/**
 * 攻防の後に残った防御を次のターンへ持ち越す敵か。設定に `carryDefense: true` がある敵。
 * @param {{ carryDefense?: boolean }} spec 敵の種類の設定
 * @returns {boolean} 持ち越すなら true
 */
export function carriesDefense(spec) {
  return spec.carryDefense === true;
}

/**
 * 予告に、持ち越した溜めを付ける。持ち越さない敵は予告をそのまま返す（同じオブジェクト。キーも増えない）。
 * 持ち越す敵は、まず予告から前の溜めの分を外した「素の量」を求め（`intent.stock` があれば 素の防御 = `stock.gain`・素の攻撃 = `amount − stock.spent`、
 * なければ予告の `defense`・`amount`）、そこから付け直すので、同じ予告に何度通しても同じ結果になる（DEBUG の溜めの操作が付け直しに使える）。
 * - `spendStock` の予告（体当たり）: `amount` = 素の攻撃 + 溜め、`defense` = 素の防御、`stock: { gain: 素の防御, spent: 溜め }`。
 * - それ以外: `amount` = 素の攻撃、`defense` = 溜め + 素の防御、`stock: { gain: 素の防御, spent: 0 }`。
 * 例（溜め 5）: 防御を取る（素の防御 4）→ defense 9・stock { gain: 4, spent: 0 }。体当たり（素の攻撃 4）→ amount 9・defense 0・stock { gain: 0, spent: 5 }。
 * @param {{ carryDefense?: boolean }} spec 敵の種類の設定
 * @param {import('./combatants.js').EnemyIntent} intent 予告
 * @param {number} stock 持ち越した溜め（0 以上の整数）
 * @returns {import('./combatants.js').EnemyIntent} 溜めを付けた新しい予告（持ち越さない敵は `intent` そのもの）
 */
export function intentWithStock(spec, intent, stock) {
  if (!carriesDefense(spec)) return intent;
  const baseDefense = intent.stock ? intent.stock.gain : intent.defense;
  const baseAmount = intent.stock ? intent.amount - intent.stock.spent : intent.amount;
  if (intent.spendStock === true) {
    return { ...intent, amount: baseAmount + stock, defense: baseDefense, stock: { gain: baseDefense, spent: stock } };
  }
  return { ...intent, amount: baseAmount, defense: stock + baseDefense, stock: { gain: baseDefense, spent: 0 } };
}

/**
 * 予告の攻撃に移した溜めの量を返す（`intent.stock` がなければ 0）。
 * @param {import('./combatants.js').EnemyIntent} intent 予告
 * @returns {number} 攻撃に移した溜め（0 以上の整数）
 */
export function stockSpentOf(intent) {
  return intent.stock ? intent.stock.spent : 0;
}

/**
 * 攻防の後の溜めを求める。
 * 持ち越さない敵は 0。倒した攻防は 0（戦闘が終わるので次の敵に残らない）。
 * それ以外は `intent.defense − 出来事 enemyBlock の量（なければ 0）`。
 * 剣が溜めより少ない → 防御 − 剣、同じ → 0、多い → 0（`enemyBlock` = min(剣, 防御)。多い分は本体に当たる）。
 * 城が落ちた攻防は `enemyBlock` がない（剣が当たる前に終わる）のでそのまま。体当たりのターンは防御 0 なので 0。
 * @param {{ carryDefense?: boolean }} spec 敵の種類の設定
 * @param {{ defense: number }} intent その攻防の予告
 * @param {ReadonlyArray<{ type: string, amount: number }>} events 攻防の出来事の並び
 * @param {boolean} defeated 敵を倒した攻防か
 * @returns {number} 次のターンへ持ち越す溜め（0 以上の整数）
 */
export function stockAfterBattle(spec, intent, events, defeated) {
  if (!carriesDefense(spec) || defeated) return 0;
  const blocked = events.filter((event) => event.type === 'enemyBlock').reduce((sum, event) => sum + event.amount, 0);
  return Math.max(0, intent.defense - blocked);
}
