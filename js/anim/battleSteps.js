/**
 * 攻防の前の値の写しと、攻防の出来事の並びから演出の段の並びを組み立てる。
 * 札が燃える出来事も段にする。ルールの判定や計算はせず、描画も状態の変更も行わない。
 */

/**
 * 攻防の前の値の写し。
 * @typedef {Object} BattleSnapshot
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} enemyHp 攻防の前の敵の HP
 * @property {number} attack 攻防の前の攻撃ゲージの値（攻撃の兵の数）
 * @property {number} defense 攻防の前の防御ゲージの値（防御の兵の数）
 * @property {number} heal 攻防の前の修理ゲージの値（修理の兵の数）
 * @property {Array<Array<*>>} columns 攻防の前の列ごとのカードの並びの写し（[0] が一番下）
 */

/**
 * 演出の1段。
 * @typedef {Object} BattleStep
 * @property {'form'|'enemyMarch'|'block'|'castleHit'|'march'|'enemyBlock'|'armorBlock'|'enemyHit'|'heal'|'enemyHeal'|'burn'} type 段の種類
 * @property {number} amount 量（`form` は 0、`burn` は燃える枚数）
 * @property {Array<{columnIndex: number, cardIndex: number, card: *}>} [burns] `burn` のみ: 燃える札の並び（燃える順）
 * @property {{attack: number, defense: number, heal: number}} [troops] `form` のみ: 自軍の兵の数（攻撃・防御・修理）
 * @property {number} [enemyGuards] `form` のみ: 敵の守りの数
 * @property {number} [pairs] `enemyMarch` のみ: 防御の兵と相打ちになる組の数（`block` の量。なければ 0）。`march` のみ: 敵の守りと相打ちになる組の数（`enemyBlock` の量。なければ 0）
 */

/** 「自軍の突撃」を、その直前に差し込む出来事の種類。 */
const MARCH_BEFORE = new Set(['enemyBlock', 'enemyArmorBlock', 'enemyDamage', 'heal', 'win']);

/** 出来事の種類から、量をそのまま持つ段の種類への対応。 */
const EVENT_TO_STEP = {
  block: 'block',
  castleDamage: 'castleHit',
  enemyBlock: 'enemyBlock',
  enemyArmorBlock: 'armorBlock',
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
    attack: game.gauges.attack ?? 0,
    defense: game.gauges.defense ?? 0,
    heal: game.gauges.heal ?? 0,
    columns: game.columns.map((col) => col.slice()),
  };
}

/**
 * 攻防の出来事の並びから、演出の段の並びを組み立てる。
 * `lose`・`win` に来たらそこで読むのをやめる。量が 0 の段は作らない。
 * @param {import('../rules/Game.js').BattleResult} result 攻防の結果
 * @param {BattleSnapshot} before 攻防の前の値
 * @returns {BattleStep[]} 段の並び
 */
export function buildBattleSteps(result, before) {
  /** @type {BattleStep[]} */
  const steps = [];
  const events = result.events;

  const enemyAttack = events.find((e) => e.type === 'enemyAttack');
  const enemyDefend = events.find((e) => e.type === 'enemyDefend');
  const enemyGuards = enemyDefend ? enemyDefend.amount : 0;
  if (before.attack > 0 || before.defense > 0 || before.heal > 0 || enemyGuards > 0) {
    const troops = { attack: before.attack, defense: before.defense, heal: before.heal };
    steps.push({ type: 'form', amount: 0, troops, enemyGuards });
  }
  const blockEvent = events.find((e) => e.type === 'block');
  const enemyBlockEvent = events.find((e) => e.type === 'enemyBlock');
  const blockPairs = blockEvent ? blockEvent.amount : 0;
  const enemyBlockPairs = enemyBlockEvent ? enemyBlockEvent.amount : 0;
  if (enemyAttack && enemyAttack.amount > 0) {
    steps.push({ type: 'enemyMarch', amount: enemyAttack.amount, pairs: blockPairs });
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
    if (event.type === 'win') break;
    if (event.type === 'cardBurn') {
      if (event.amount > 0) steps.push({ type: 'burn', amount: event.amount, burns: [...event.burns] });
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
  return steps;
}
