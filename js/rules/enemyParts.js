/**
 * 責務: 親と子を持つ敵の純粋な計算（HP の分け方・局面・剣の当たり方の分け方・DEBUG の HP の付け方・中断データの形の確かめ）。
 * ルール層。何も import せず、画面・エンジンには触れない。
 */

/**
 * 親と子の HP。
 * @typedef {Object} EnemyParts
 * @property {number} parent 親の HP
 * @property {number} child 子の HP
 */

/**
 * 局面の識別子の並び（子がいる間・怒り・子だけ）。
 * @type {ReadonlyArray<'together'|'enraged'|'young'>}
 */
export const ENEMY_SITUATIONS = Object.freeze(['together', 'enraged', 'young']);

/**
 * 親と子の最大 HP を求める。子 = floor(maxHp × childPercent / 100)、親 = maxHp − 子。
 * @param {{ childPercent: number }} brood 親と子を持つ敵の設定
 * @param {number} maxHp ステージの加算の後の最大 HP（親子の合計）
 * @returns {EnemyParts} 親と子の最大 HP
 */
export function partMaxHps(brood, maxHp) {
  const child = Math.floor((maxHp * brood.childPercent) / 100);
  return { parent: maxHp - child, child };
}

/**
 * 敵の設定から、親と子の最大 HP を作る。
 * @param {{ brood?: { childPercent: number } }} spec 敵の種類の設定
 * @param {number} maxHp ステージの加算の後の最大 HP
 * @returns {EnemyParts|null} 親子の敵なら親と子の最大 HP、そうでなければ null
 */
export function createEnemyParts(spec, maxHp) {
  if (!spec.brood) return null;
  return partMaxHps(spec.brood, maxHp);
}

/**
 * 親と子の HP から局面を求める。
 * @param {EnemyParts|null|undefined} parts 親と子の HP（親子でない敵は null か undefined）
 * @returns {'together'|'enraged'|'young'|null} 局面（親子でない・両方 0 なら null）
 */
export function enemySituationOf(parts) {
  if (!parts) return null;
  if (parts.parent > 0 && parts.child > 0) return 'together';
  if (parts.parent > 0) return 'enraged';
  if (parts.child > 0) return 'young';
  return null;
}

/**
 * 攻防の剣の当たり方の入力（攻防の前の親と子の HP と当たる順）。
 * @typedef {Object} BattleParts
 * @property {EnemyParts} hp 攻防の前の親と子の HP
 * @property {ReadonlyArray<'parent'|'child'>} order 防御で止まった後の剣の当たる順
 */

/**
 * 剣が当たった先と量。
 * @typedef {Object} PartDamage
 * @property {'parent'|'child'} part 当たった先
 * @property {number} amount 当たった量（0 より大きい）
 */

/**
 * 攻防に渡す親と子の HP と当たる順を求める。
 * @param {{ brood?: { hitOrder: Object<string, ReadonlyArray<'parent'|'child'>> } }} spec 敵の種類の設定
 * @param {EnemyParts|null|undefined} parts 敵の今の親と子の HP（親子でない敵は null か undefined）
 * @param {string} kind 予告の種類（'attack'・'windup'・'guard'）
 * @returns {BattleParts|null} 親子の敵なら親と子の HP と当たる順、そうでなければ null
 */
export function battlePartsOf(spec, parts, kind) {
  if (!spec.brood || !parts) return null;
  const { hitOrder } = spec.brood;
  const order = Object.prototype.hasOwnProperty.call(hitOrder, kind) ? hitOrder[kind] : hitOrder.default;
  return { hp: { parent: parts.parent, child: parts.child }, order: order.slice() };
}

/**
 * 敵へのダメージを、当たる順に親と子へ分ける。その部分の HP までを当て、残りを次へ回す。
 * @param {BattleParts} battleParts 攻防の前の親と子の HP と当たる順
 * @param {number} dealt 敵へのダメージの合計（0 以上の整数）
 * @returns {{ damages: PartDamage[], after: EnemyParts }} 当たった先ごとの量（当たる順・量が 0 より大きいものだけ）と、攻防の後の親と子の HP
 */
export function splitPartDamage(battleParts, dealt) {
  const after = { parent: battleParts.hp.parent, child: battleParts.hp.child };
  /** @type {PartDamage[]} */
  const damages = [];
  let rest = dealt;
  for (const part of battleParts.order) {
    const amount = Math.min(rest, after[part]);
    if (amount > 0) {
      damages.push({ part, amount });
      after[part] -= amount;
      rest -= amount;
    }
  }
  return { damages, after };
}

/**
 * 最大 HP を変えたとき、親と子の HP を新しい最大に合わせる。親と子をそれぞれ新しい最大で頭打ちにし（上げない）、
 * 合計が 0 になるときは親に 1 を残す。入力は書き換えない。
 * @param {{ childPercent: number }} brood 親と子を持つ敵の設定
 * @param {number} maxHp 新しい最大 HP（ステージの加算の後。親子の合計）
 * @param {EnemyParts} parts 今の親と子の HP
 * @returns {EnemyParts} 合わせた後の親と子の HP
 */
export function fitPartsToMax(brood, maxHp, parts) {
  const max = partMaxHps(brood, maxHp);
  const parent = Math.min(parts.parent, max.parent);
  const child = Math.min(parts.child, max.child);
  if (parent + child === 0) return { parent: 1, child: 0 };
  return { parent, child };
}

/**
 * 親子の合計の HP を指定したとき、親と子の HP を決める。満タン（合計が最大以上）は親子とも最大。
 * それ以外は、生きている部分（HP が 0 より大きい）を親 → 子の順にそれぞれの最大まで満たし、
 * 足りなければ倒れている部分へ親 → 子の順に回す。入力は書き換えない。
 * @param {{ childPercent: number }} brood 親と子を持つ敵の設定
 * @param {number} maxHp 最大 HP（親子の合計）
 * @param {EnemyParts} parts 今の親と子の HP
 * @param {number} hp 指定する合計の HP（0 以上の整数）
 * @returns {EnemyParts} 親と子の HP（合計は hp。hp が最大を超えるときは最大）
 */
export function partsWithTotal(brood, maxHp, parts, hp) {
  const max = partMaxHps(brood, maxHp);
  if (hp >= maxHp) return { parent: max.parent, child: max.child };
  /** @type {Array<'parent'|'child'>} */
  const order = ['parent', 'child'];
  const alive = order.filter((part) => parts[part] > 0);
  const dead = order.filter((part) => !(parts[part] > 0));
  const result = { parent: 0, child: 0 };
  let rest = hp;
  for (const part of [...alive, ...dead]) {
    const amount = Math.min(rest, max[part]);
    result[part] = amount;
    rest -= amount;
  }
  return result;
}

/**
 * 親か子の HP を 0 にする。もう片方が 0 のときは、倒したことにならないよう 0 にせず 1 を残す。入力は書き換えない。
 * @param {EnemyParts} parts 今の親と子の HP
 * @param {'parent'|'child'} part 0 にする側
 * @returns {EnemyParts} 新しい親と子の HP
 */
export function zeroPart(parts, part) {
  const other = part === 'parent' ? 'child' : 'parent';
  const result = { parent: parts.parent, child: parts.child };
  result[part] = parts[other] > 0 ? 0 : 1;
  return result;
}
