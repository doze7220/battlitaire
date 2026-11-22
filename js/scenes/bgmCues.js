/**
 * 責務: タイトル・ステージの BGM を流し、「はじめる」と HP が 0 になった瞬間に止め、BGM の音量を Sound に渡す（Sound.playBgm・stopBgm・bgmVolume を触るのはここだけ）。
 * シーンから呼ばれる音の補助モジュール（Scene を継承しない）。状態は持たず、ルールの判定はしない。
 */
import { Sound } from 'oz';
import { STAGE_BGM, BGM_TIMING } from '../audio/soundConfig.js';

/** タイトルの曲の名前（`BGM_FILES` の名前）。 @type {string} */
export const TITLE_BGM = 'title';

/**
 * 敵の種類の識別子から、ステージの曲の名前を引く（純粋関数）。
 * @param {string} typeId 敵の種類の識別子（`game.enemy.typeId`）
 * @returns {string|null} 曲の名前。表にない種類なら null
 */
export function stageBgmName(typeId) {
  return Object.prototype.hasOwnProperty.call(STAGE_BGM, typeId) ? STAGE_BGM[typeId] : null;
}

/**
 * タイトルの曲を流す。同じ曲が流れていれば何もしない（エンジンの決まり）。
 * @returns {void}
 */
export function playTitleBgm() {
  Sound.playBgm(TITLE_BGM, { fadeMs: BGM_TIMING.titleFadeInMs });
}

/**
 * 「はじめる」でタイトルの曲を短いフェードアウトで止める。
 * @returns {void}
 */
export function stopTitleBgm() {
  Sound.stopBgm({ fadeMs: BGM_TIMING.startFadeOutMs });
}

/**
 * 敵の種類に対応するステージの曲を頭から流す。対応する曲がなければ何もしない。
 * @param {string} typeId 敵の種類の識別子（`game.enemy.typeId`）
 * @returns {void}
 */
export function playStageBgm(typeId) {
  const name = stageBgmName(typeId);
  if (name === null) return;
  Sound.playBgm(name, { fadeMs: BGM_TIMING.stageFadeInMs });
}

/**
 * HP が 0 になった瞬間に BGM を短いフェードアウトで止める。流れていなければエンジンが何もしない。
 * @returns {void}
 */
export function stopBgmOnKnockout() {
  Sound.stopBgm({ fadeMs: BGM_TIMING.knockoutFadeOutMs });
}

/**
 * BGM の音量を Sound に渡す（流れている曲にもその場で効く）。
 * @param {number} v 音量（0〜1）
 * @returns {void}
 */
export function setBgmVolume(v) {
  Sound.bgmVolume = v;
}
