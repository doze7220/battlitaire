/**
 * 責務: 段取りの操作・連鎖・行動終了・攻防のきっかけ・決着から鳴らす効果音を決め、Sound.playSe で鳴らすこと。
 * シーンから呼ばれる音の補助モジュール（Scene を継承しない）。ルールの判定はしない。
 */
import { Sound } from 'oz';
import { CHAIN_PITCH } from '../audio/soundConfig.js';

/**
 * 段取りの操作の種類 → 音の名前。
 * @type {Readonly<Record<string, string>>}
 */
export const PLANNING_SE = Object.freeze({
  place: 'place',
  hold: 'place',
  placeFromHand: 'place',
  move: 'place',
  discard: 'discard',
  release: 'release',
});

/**
 * 攻防の段の種類（きっかけの type）→ 音の名前。
 * @type {Readonly<Record<string, string>>}
 */
export const BATTLE_CUE_SE = Object.freeze({
  block: 'block',
  enemyBlock: 'block',
  armorBlock: 'block',
  castleHit: 'castleHit',
  enemyHit: 'enemyHit',
  heal: 'heal',
});

/**
 * 決着（outcome）→ 音の名前。
 * @type {Readonly<Record<string, string>>}
 */
export const OUTCOME_SE = Object.freeze({
  win: 'win',
  lose: 'lose',
});

/** めくる（山札を選んだ）音の名前。 @type {string} */
export const FLIP_SE = 'flip';

/** 連鎖（放ったカード1枚ごと）の音の名前。 @type {string} */
export const CHAIN_SE = 'chain';

/** 行動終了（攻防に入った）音の名前。 @type {string} */
export const TURN_END_SE = 'turnEnd';

/**
 * タップの結果から鳴らす音の名前を決める（純粋関数）。
 * @param {import('./boardSelection.js').BoardSelection} prevSelection タップの前の選択
 * @param {import('./boardSelection.js').TapStep} step applyTap の戻り値
 * @returns {string|null} 音の名前。鳴らさないなら null
 */
export function planningSeName(prevSelection, step) {
  if (step.result !== null) return PLANNING_SE[step.result.type] ?? null;
  const sel = step.selection;
  if (sel !== null && sel.kind === 'deck') {
    const same = prevSelection !== null && prevSelection.kind === 'deck' && prevSelection.index === sel.index;
    if (!same) return FLIP_SE;
  }
  return null;
}

/**
 * タップの結果に応じた音があれば鳴らす。
 * @param {import('./boardSelection.js').BoardSelection} prevSelection タップの前の選択
 * @param {import('./boardSelection.js').TapStep} step applyTap の戻り値
 * @returns {void}
 */
export function playPlanningSe(prevSelection, step) {
  const name = planningSeName(prevSelection, step);
  if (name !== null) Sound.playSe(name);
}

/**
 * 行動終了の音を鳴らす。
 * @returns {void}
 */
export function playTurnEndSe() {
  Sound.playSe(TURN_END_SE);
}

/**
 * 連鎖の音の再生速度（音程）を、何枚目かから決める（純粋関数）。
 * 1枚目は 1。以降は1枚ごとに上げ、上限で頭打ち。ありえない値は 1。
 * @param {number} ordinal 何枚目か（1 始まりの整数）
 * @returns {number} 再生速度 rate
 */
export function chainSeRate(ordinal) {
  if (!Number.isInteger(ordinal) || ordinal < 1) return 1;
  const semitones = Math.min((ordinal - 1) * CHAIN_PITCH.stepSemitones, CHAIN_PITCH.maxSemitones);
  return 2 ** (semitones / 12);
}

/**
 * 連鎖の音を、何枚目かに応じた音程で鳴らす。
 * @param {number} ordinal 何枚目か（1 始まり）
 * @returns {void}
 */
export function playChainSe(ordinal) {
  Sound.playSe(CHAIN_SE, { rate: chainSeRate(ordinal) });
}

/**
 * 攻防のきっかけの種類に対応する音を鳴らす。対応表にない種類は鳴らさない。
 * @param {string} type きっかけの種類（段の種類）
 * @returns {void}
 */
export function playBattleCueSe(type) {
  const name = BATTLE_CUE_SE[type];
  if (name !== undefined) Sound.playSe(name);
}

/**
 * 決着の音を鳴らす。対応表にない値は鳴らさない。
 * @param {'win'|'lose'|null} outcome 決着
 * @returns {void}
 */
export function playOutcomeSe(outcome) {
  const name = OUTCOME_SE[outcome];
  if (name !== undefined) Sound.playSe(name);
}
