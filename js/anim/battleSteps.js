/**
 * 攻防の前の値の写しと、攻防の出来事の並びから演出の段の並びを組み立てる。
 * 札が燃える出来事も段にする。ルールの判定や計算はせず、描画も状態の変更も行わない。
 */

/**
 * 攻防の前の値の写し。
 * @typedef {Object} BattleSnapshot
 * @property {number} castleHp 攻防の前の城の HP
 * @property {number} enemyHp 攻防の前の敵の HP
 * @property {number} attack 攻防の前の攻撃ゲージの値（兵士の数）
 * @property {number} defense 攻防の前の防御ゲージの値（守備兵の数）
 * @property {Array<Array<*>>} columns 攻防の前の列ごとのカードの並びの写し（[0] が一番下）
 * @property {{current: number, max: number}|null} enemyCharge 攻防の前の敵のチャージ（持たない敵は null）
 */

/**
 * 演出の1段。
 * @typedef {Object} BattleStep
 * @property {'form'|'enemyMarch'|'block'|'castleHit'|'march'|'enemyBlock'|'armorBlock'|'enemyHit'|'heal'|'enemyHeal'|'burn'} type 段の種類
 * @property {number} amount 量（`form` は 0、`burn` は燃える枚数）
 * @property {Array<{columnIndex: number, cardIndex: number, card: *}>} [burns] `burn` のみ: 燃える札の並び（燃える順）
 * @property {number} [guards] `form` のみ: 守備兵の数
 * @property {number} [enemyGuards] `form` のみ: 敵の守りの数
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
    columns: game.columns.map((col) => col.slice()),
    enemyCharge: game.enemyCharge(),
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
  const guards = before.defense;
  const enemyGuards = enemyDefend ? enemyDefend.amount : 0;
  if (guards > 0 || enemyGuards > 0) {
    steps.push({ type: 'form', amount: 0, guards, enemyGuards });
  }
  if (enemyAttack && enemyAttack.amount > 0) {
    steps.push({ type: 'enemyMarch', amount: enemyAttack.amount });
  }

  let marchDone = before.attack <= 0;
  let stoppedByLose = false;
  for (const event of events) {
    if (event.type === 'lose') {
      stoppedByLose = true;
      break;
    }
    if (!marchDone && MARCH_BEFORE.has(event.type)) {
      steps.push({ type: 'march', amount: before.attack });
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
    steps.push({ type: 'march', amount: before.attack });
  }
  return steps;
}
