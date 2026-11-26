/**
 * 攻防の前の値の写しと、攻防の出来事の並びから演出の段の並びを組み立てる。
 * 敵の攻撃の段は敵ごとの見せ方の表から作り、札が燃える段は敵の攻撃と同時に始める。大きな一撃の印とための段も付ける。
 * ルールの判定や計算はせず、描画も状態の変更も行わない。
 */

import { insertDashSteps } from './dashSteps.js';
import { enemyAttackShow, enemyDefenseShow, hasChargeShow, isHeavyAttack } from './enemyShows.js';

/**
 * 攻防の前の値の写し。
 * @typedef {Object} BattleSnapshot
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} enemyHp 攻防の前の敵の HP
 * @property {number} enemyMaxHp 敵の最大 HP（絵の体の大きさ（縮み）を求める）
 * @property {string} enemyTypeId 攻防をする敵の種類の識別子
 * @property {number} enemyUnit 攻防をする敵の1体のポイント（1 以上の整数。群れ・攻撃・守りの体の割り振りに使う）
 * @property {number} enemyDefense そのターンの敵の防御の量（疲弊の後。攻防の前の予告の `defense` の写し。絵を持つ敵のシールドの数）
 * @property {number} attack 攻防の前の攻撃ゲージの値（攻撃の兵のポイントの合計 = 人数 + 精鋭の上振れ）
 * @property {number} defense 攻防の前の防御ゲージの値（防御の兵のポイントの合計 = 人数 + 精鋭の上振れ）
 * @property {number} heal 攻防の前の修理ゲージの値（修理の兵のポイントの合計 = 人数 + 精鋭の上振れ）
 * @property {Object<string, {count: number, extra: number}>} elites 攻防の前のゲージごとの精鋭の数と上振れ（`game.eliteBoost()` の写し）
 * @property {Array<Array<*>>} columns 攻防の前の列ごとのカードの並びの写し（[0] が一番下）
 */

/**
 * 演出の1段。
 * @typedef {Object} BattleStep
 * @property {'form'|'enemyMarch'|'block'|'castleHit'|'strikeBlock'|'strikeCastle'|'march'|'enemyBlock'|'shieldBlock'|'enemyHit'|'heal'|'enemyHeal'|'burn'|'charge'|'dash'|'dashBack'} type 段の種類
 * @property {number} amount 量（`form`・`charge` は 0、`burn` は燃える枚数）
 * @property {boolean} [heavy] 敵の攻撃の段（`enemyMarch`・`block`・`castleHit`・`strikeBlock`・`strikeCastle`）のみ: 大きな一撃なら true（そうでなければ付けない）
 * @property {Array<{columnIndex: number, cardIndex: number, card: *}>} [burns] `burn` のみ: 燃える札の並び（燃える順）
 * @property {number} [enemyGuards] `form` のみ: 現れる敵の守りの数
 * @property {number} [pairs] `enemyMarch` のみ: 防御の兵と相打ちで消し合うポイントの量（`block` の量。1体1ポイントなら組の数。なければ 0）。`march` のみ: 敵の守りと相打ちで消し合うポイントの量（`enemyBlock` の量。なければ 0）
 * @property {'enemy'|'flame'} [kind] `enemyMarch`・`block`・`castleHit` のみ: 敵の側の兵の種類
 * @property {'offscreen'|'mouth'} [from] `enemyMarch` のみ: 敵の側の兵の出る場所
 * @property {'defense'|'castle'} [to] `dash` のみ: 絵が駆け寄る行き先（防御の兵の前・城の前）
 * @property {string} [style] `dash`・`dashBack` のみ: 駆け寄りの見せ方の名前（`DASH_STYLES` の項目名）
 * @property {boolean} [parallel] `burn`・`form` のみ: true なら次の段と同時に始める
 */

/** 「自軍の突撃」を、その直前に差し込む出来事の種類。 */
const MARCH_BEFORE = new Set(['enemyBlock', 'enemyDamage', 'heal']);

/** 出来事の種類から、量をそのまま持つ段の種類への対応。 */
const EVENT_TO_STEP = {
  enemyDamage: 'enemyHit',
  heal: 'heal',
  enemyHeal: 'enemyHeal',
};

/**
 * 攻防の前（`resolveBattle()` を呼ぶ前）の値を写す。読むだけで変更しない。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @returns {BattleSnapshot} 攻防の前の値
 */
export function snapshotBattle(game) {
  return {
    castleHp: game.castle.hp,
    enemyHp: game.enemy.hp,
    enemyMaxHp: game.enemy.maxHp,
    enemyTypeId: game.enemy.typeId,
    enemyUnit: game.enemyUnitPoints(),
    enemyDefense: game.enemy.intent === null ? 0 : game.enemy.intent.defense,
    attack: game.gauges.attack ?? 0,
    defense: game.gauges.defense ?? 0,
    heal: game.gauges.heal ?? 0,
    elites: game.eliteBoost(),
    columns: game.columns.map((col) => col.slice()),
  };
}

/**
 * 攻防の出来事の並びから、演出の段の並びを組み立てる。
 * `lose` に来たらそこで読むのをやめる。量が 0 の段は作らない。攻撃の見せ方が駆け寄りを持つときは、最後に駆け寄り・戻りの段を差し込む。
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果
 * @param {BattleSnapshot} before 攻防の前の値
 * @returns {BattleStep[]} 段の並び
 */
export function buildBattleSteps(result, before) {
  /** @type {BattleStep[]} */
  const steps = [];
  const events = result.events;
  const action = result.enemyAction;
  const show = enemyAttackShow(before.enemyTypeId, action.variant);
  const defenseShow = enemyDefenseShow(before.enemyTypeId);
  const heavy = action.kind === 'attack' && isHeavyAttack(before.enemyTypeId, action.variant);
  const heavyMark = heavy ? { heavy: true } : {};

  if (events.some((e) => e.type === 'enemyWindup') && hasChargeShow(before.enemyTypeId, action.variant)) {
    steps.push({ type: 'charge', amount: 0 });
  }
  const enemyAttack = events.find((e) => e.type === 'enemyAttack');
  const enemyDefend = events.find((e) => e.type === 'enemyDefend');
  if (defenseShow.unit !== null && enemyDefend) {
    const formStep = { type: 'form', amount: 0, enemyGuards: enemyDefend.amount };
    steps.push(enemyAttack && enemyAttack.amount > 0 ? { ...formStep, parallel: true } : formStep);
  }
  const blockEvent = events.find((e) => e.type === 'block');
  const enemyBlockEvent = events.find((e) => e.type === 'enemyBlock');
  const blockPairs = blockEvent ? blockEvent.amount : 0;
  const enemyBlockPairs = defenseShow.unit !== null && enemyBlockEvent ? enemyBlockEvent.amount : 0;
  const burnEvent = events.find((e) => e.type === 'cardBurn' && e.amount > 0);
  let burnPlaced = false;
  if (enemyAttack && enemyAttack.amount > 0) {
    if (burnEvent) {
      steps.push({ type: 'burn', amount: burnEvent.amount, burns: [...burnEvent.burns], parallel: true });
      burnPlaced = true;
    }
    if (show.unit !== null) {
      steps.push({ type: 'enemyMarch', amount: enemyAttack.amount, pairs: blockPairs, kind: show.unit, from: show.from, ...heavyMark });
    }
  }

  let marchDone = before.attack <= 0;
  let stoppedByLose = false;
  for (const event of events) {
    if (event.type === 'lose') {
      stoppedByLose = true;
      break;
    }
    if (!marchDone && MARCH_BEFORE.has(event.type)) {
      steps.push({ type: 'march', amount: before.attack, pairs: enemyBlockPairs });
      marchDone = true;
    }
    if (event.type === 'cardBurn') {
      if (event.amount > 0 && !burnPlaced) {
        steps.push({ type: 'burn', amount: event.amount, burns: [...event.burns] });
      }
      continue;
    }
    if (event.amount > 0 && (event.type === 'block' || event.type === 'castleDamage')) {
      const type = event.type === 'block' ? show.blockStep : show.castleStep;
      steps.push(
        show.unit !== null
          ? { type, amount: event.amount, kind: show.unit, ...heavyMark }
          : { type, amount: event.amount, ...heavyMark },
      );
      continue;
    }
    if (event.type === 'enemyBlock') {
      if (event.amount > 0) steps.push({ type: defenseShow.blockStep, amount: event.amount });
      continue;
    }
    const stepType = EVENT_TO_STEP[event.type];
    if (stepType !== undefined && event.amount > 0) {
      steps.push({ type: stepType, amount: event.amount });
    }
  }
  if (!marchDone && !stoppedByLose) {
    steps.push({ type: 'march', amount: before.attack, pairs: enemyBlockPairs });
  }
  return show.dash !== null ? insertDashSteps(steps, show.dash, stoppedByLose) : steps;
}
