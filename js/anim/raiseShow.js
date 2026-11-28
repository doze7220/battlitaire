/**
 * 責務: 死んだ自軍の兵を亡者（子）に変える見せ方。段の前に倒れうる兵を写し、組み立ての後に倒れた兵を段の `raised` 人だけ、その場で消して同じ位置から待つ場所へ歩く亡者にする。
 * ルールの判定や数え直しはせず（人数は出来事の項目の写し）、描画も状態の変更も行わない。乱数は使わない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { enterTroops } from './troopRoster.js';
import { vanishTroopEnd } from './troopMotion.js';

/**
 * 段の種類 → 倒れて亡者になりうる自軍の兵の種類（凍結した表）。敵の攻撃で死んだ盾の兵（`block`・`strikeBlock`）、
 * 敵の防御で死んだ剣の兵（`enemyBlock`・`shieldBlock`）。
 * @type {Readonly<Record<string, 'attack'|'defense'>>}
 */
export const RAISE_VICTIMS = Object.freeze({
  block: 'defense',
  strikeBlock: 'defense',
  enemyBlock: 'attack',
  shieldBlock: 'attack',
});

/**
 * 段の前の写し（`watchRaise` の戻り値）。
 * @typedef {Object} RaiseWatch
 * @property {'attack'|'defense'} kind 倒れうる兵の種類
 * @property {import('./troopMotion.js').TroopUnit[]} open 段の前にまだ終わり方の決まっていなかったその種類の兵（名簿の前からの並び）
 */

/**
 * 段の組み立ての前に呼び、段が亡者に変わる兵を持つなら、その種類のまだ終わり方の決まっていない兵の並びを写す（名簿は変えない）。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @returns {RaiseWatch|null} 写し（段の `raised` が 1 以上で、段の種類が `RAISE_VICTIMS` にあるときだけ。なければ null）
 */
export function watchRaise(roster, step) {
  if (!(step.raised >= 1)) return null;
  if (!Object.prototype.hasOwnProperty.call(RAISE_VICTIMS, step.type)) return null;
  const kind = RAISE_VICTIMS[step.type];
  const list = roster.ranked[kind] || [];
  return { kind, open: list.filter((unit) => unit.end === null) };
}

/**
 * 段の組み立ての後に呼び、写しの兵のうち終わり方が 'fall' に決まった兵を、終わり方の時刻の順（同じなら写しの並びの順）に count 人まで選び、
 * その場で消える終わり方に替え（`vanishTroopEnd`。時刻・位置・ポイントは同じ）、同じ時刻・同じ足元の位置から亡者（`minionBorn`）を1体ずつ出して
 * 待つ場所（陣地 `minion`）へ `raiseWalkMs` かけて歩かせる。倒れた兵が count より少なくても Error にしない（あるだけ変える）。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {RaiseWatch} watched `watchRaise` の戻り値
 * @param {number} count 亡者に変える人数（段の `raised`）
 * @returns {number} 亡者が全員待つ場所に着く時刻（ms。選ぶ兵がなければ 0）
 * @throws {Error} count が 1 以上で、配置に子の陣地（`camps.minion`）がないとき
 */
export function raiseFallen(roster, watched, count) {
  if (count >= 1 && roster.layout.camps.minion === undefined) {
    throw new Error('raiseFallen: 配置に子の陣地（camps.minion）がありません');
  }
  const fallen = watched.open
    .filter((unit) => unit.end !== null && unit.end.type === 'fall')
    .map((unit, order) => ({ unit, order }))
    .sort((a, b) => a.unit.end.time - b.unit.end.time || a.order - b.order)
    .slice(0, Math.max(0, count))
    .map((entry) => entry.unit);
  let riseEnd = 0;
  for (const unit of fallen) {
    const { time, x, y } = unit.end;
    vanishTroopEnd(unit);
    const arrived = enterTroops(roster, 'minionBorn', [{ points: 1, wounded: false }], x, y, time, BATTLE_ANIM.raiseWalkMs);
    riseEnd = Math.max(riseEnd, arrived);
  }
  return riseEnd;
}
