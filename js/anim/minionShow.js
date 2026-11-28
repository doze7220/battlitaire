/**
 * 責務: 次のターンに持ち越す攻撃のユニット（子）の攻防の見せ方。出来事から子の段（襲う・生まれる）を作り、名簿へ待っていた子を置く・襲う行進・生まれて待つ場所へ跳ぶ脚を割り当てる。
 * ルールの判定や計算・描画・状態の変更はしない。乱数は使わない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { enterTroops, marchSquad, spawnTroops } from './troopRoster.js';

/**
 * 出来事の並びから、襲う子の段（行進・盾の兵との相打ち・城への当たり）を作る。`minionAttack` がなければ空。
 * 相打ちの量は `block.minions`、城への当たりの量は `castleDamage.minions`（どちらも 0 のときは段を作らない）。
 * 相打ちの段には、`block.raisedByMinions`（亡者との相打ちで亡者になる人数）があれば `raised` としてそのまま写す。
 * @param {Array<{type: string, amount: number, minions?: number, raisedByMinions?: number}>} events 攻防の出来事の並び（`BattleResult.events`）
 * @returns {import('./battleSteps.js').BattleStep[]} 子の段の並び（`minionMarch`・`block`・`castleHit`。段の種類 `block`・`castleHit` の `kind` は 'minion'）
 */
export function minionAttackSteps(events) {
  const attack = events.find((e) => e.type === 'minionAttack');
  if (attack === undefined) return [];
  const block = events.find((e) => e.type === 'block');
  const castle = events.find((e) => e.type === 'castleDamage');
  const blocked = block !== undefined ? (block.minions ?? 0) : 0;
  const damage = castle !== undefined ? (castle.minions ?? 0) : 0;
  /** @type {import('./battleSteps.js').BattleStep[]} */
  const steps = [{ type: 'minionMarch', amount: attack.amount, pairs: blocked }];
  if (blocked > 0) {
    const raised = block !== undefined && block.raisedByMinions !== undefined ? { raised: block.raisedByMinions } : {};
    steps.push({ type: 'block', amount: blocked, kind: 'minion', ...raised });
  }
  if (damage > 0) steps.push({ type: 'castleHit', amount: damage, kind: 'minion' });
  return steps;
}

/**
 * 攻防の前に待っていた子を、時刻 0 から待つ場所（陣地 `minion`）の番号 0〜count−1 の位置に置く。count が 0 以下なら何もしない。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {number} count 待っていた子の数（`BattleSnapshot.enemyMinions`）
 * @returns {void}
 * @throws {Error} count が 1 以上で、配置に子の陣地（`camps.minion`）がないとき
 */
export function placeWaitingMinions(roster, count) {
  if (!(count >= 1)) return;
  if (roster.layout.camps.minion === undefined) {
    throw new Error('placeWaitingMinions: 配置に子の陣地（camps.minion）がありません');
  }
  spawnTroops(roster, 'minion', count, 0, 0);
}

/**
 * 待っていた子の数と、段の並びの子の行進の量が合うか確かめる（写しと出来事の食い違いを早く見つける）。
 * 行進の段がなければ量は 0 とみなす。
 * @param {import('./battleSteps.js').BattleStep[]} steps 段の並び
 * @param {number} count 待っていた子の数
 * @returns {void}
 * @throws {Error} 行進の量が count と違うとき
 */
export function checkWaitingMinions(steps, count) {
  const march = steps.find((s) => s.type === 'minionMarch');
  const amount = march !== undefined ? march.amount : 0;
  if (amount !== count) {
    throw new Error(`buildBattleTimeline: 待っていた子の数 ${count} が襲う子の数 ${amount} と違います`);
  }
}

/**
 * 襲う子の行進の段。待つ場所の子が、盾の兵（防御の兵）と組になって前へ進む（組のない子は `enemyAdvanceX` だけ進む）。向きは左。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('./battleSteps.js').BattleStep} step 段（`pairs` が盾の兵と相打ちになる子の数）
 * @param {number} t 段の始め（ms）
 * @param {number} moveScale 進む脚の長さの倍率
 * @returns {number} 段の長さ（ms）
 */
export function marchMinions(roster, step, t, moveScale) {
  return marchSquad(roster, {
    kind: 'minion',
    partnerKind: 'defense',
    pairs: step.pairs ?? 0,
    dir: -1,
    advanceX: roster.layout.enemyAdvanceX,
    t,
    moveScale,
    partnerScale: 1,
  });
}

/**
 * 生まれた子が、敵の絵の足元の中央（`hatch`）から、待つ場所の番号 0 から順の位置へ跳んで並ぶ段。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('../view/layout.js').BattleLayout} battleLayout 戦闘の段の配置（`minionPlaces` を読む）
 * @param {string} typeId 敵の種類の識別子
 * @param {number} count 生まれた子の数
 * @param {number} t 段の始め（ms）
 * @returns {number} 段の長さ（ms。全員が着く時刻 − t）
 * @throws {Error} 子の配置を持たない識別子のとき
 */
export function hatchMinions(roster, battleLayout, typeId, count, t) {
  if (!Object.prototype.hasOwnProperty.call(battleLayout.minionPlaces, typeId)) {
    throw new Error(`hatchMinions: 子の配置を持たない敵 ${typeId}`);
  }
  const hatch = battleLayout.minionPlaces[typeId].hatch;
  const bodies = Array.from({ length: count }, () => ({ points: 1, wounded: false }));
  return enterTroops(roster, 'minionBorn', bodies, hatch.x, hatch.y, t, BATTLE_ANIM.minionHatchMs) - t;
}
