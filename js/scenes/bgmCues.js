/**
 * 責務: タイトル・戦闘（ふだん・激昂）の BGM を流し、「はじめる」と HP が 0 になった瞬間に止め、BGM の音量を Sound に渡す（Sound.playBgm・stopBgm・bgmVolume を触るのはここだけ）。
 * シーンから呼ばれる音の補助モジュール（Scene を継承しない）。状態は持たず、ルールの判定はしない。
 */
import { Sound } from 'oz';
import { BATTLE_BGM, BGM_TIMING } from '../audio/soundConfig.js';

/** タイトルの曲の名前（`BGM_FILES` の名前）。 @type {string} */
export const TITLE_BGM = 'title';

/**
 * 敵が激昂しているかから、戦闘の曲の名前を引く（純粋関数）。
 * @param {boolean} enraged 激昂しているか（`game.enemyRage().enraged`）
 * @returns {string} 曲の名前（`BGM_FILES` の名前）
 */
export function battleBgmName(enraged) {
  return BATTLE_BGM[enraged ? 'enraged' : 'normal'];
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
 * 激昂の状態に合う戦闘の曲を流す（ステージの始まり・再開・敵の入れ替え）。同じ曲が流れていれば何もしない（エンジンの決まり）。
 * @param {boolean} enraged 激昂しているか（`game.enemyRage().enraged`）
 * @returns {void}
 */
export function playBattleBgm(enraged) {
  Sound.playBgm(battleBgmName(enraged), { fadeMs: BGM_TIMING.stageFadeInMs });
}

/**
 * 激昂の状態に合う戦闘の曲へ合わせる（ターンの始まり・DEBUG）。同じ曲が流れていれば何もせず、別の曲ならクロスフェードする。
 * @param {boolean} enraged 激昂しているか（`game.enemyRage().enraged`）
 * @returns {void}
 */
export function matchBattleBgm(enraged) {
  Sound.playBgm(battleBgmName(enraged), { fadeMs: BGM_TIMING.rageFadeMs });
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
