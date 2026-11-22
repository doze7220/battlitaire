/**
 * 責務: 設定（BGM・効果音の音量と攻防の演出の速さ）の値の表と保存の設定を持ち、Storage を通して今の値を答え・新しい値を保存し・起動時に音量を反映する口。
 * Sound は import せず、音量は bgmCues.js・soundCues.js の口で渡す。
 */
import { Storage } from 'oz';
import { BGM_VOLUME, SE_VOLUME } from '../audio/soundConfig.js';
import { setBgmVolume } from './bgmCues.js';
import { setSeVolume } from './soundCues.js';

/**
 * 音量のスライダーの範囲と刻み（max - min は step の整数倍）。試遊で決め直す値。
 * @type {Readonly<{min: number, max: number, step: number}>}
 */
export const VOLUME_RANGE = Object.freeze({ min: 0, max: 1, step: 0.1 });

/**
 * 攻防の演出の速さの選択肢（選択肢の列の並び順）。id は保存する識別子、label は表示の文字、rate は演出の時間に掛ける倍率。試遊で決め直す値。
 * @type {ReadonlyArray<Readonly<{id: string, label: string, rate: number}>>}
 */
export const BATTLE_SPEEDS = Object.freeze([
  Object.freeze({ id: 'normal', label: '普通', rate: 1 }),
  Object.freeze({ id: 'fast', label: '速い', rate: 1.5 }),
]);

/** 攻防の演出の速さの初期値（`BATTLE_SPEEDS` の id）。試遊で決め直す値。 @type {string} */
export const DEFAULT_BATTLE_SPEED = 'normal';

/**
 * Storage.open に渡す保存の設定。
 * @type {Readonly<{key: string, version: number, defaults: Readonly<{bgmVolume: number, seVolume: number, battleSpeed: string}>}>}
 */
export const SETTINGS_STORAGE = Object.freeze({
  key: 'battlitaire',
  version: 1,
  defaults: Object.freeze({
    bgmVolume: BGM_VOLUME,
    seVolume: SE_VOLUME,
    battleSpeed: DEFAULT_BATTLE_SPEED,
  }),
});

/**
 * 保存された音量を読み、範囲 0〜1 の有限の数でなければ初期値にする（状態は変えない）。
 * @param {string} name 保存の名前
 * @param {number} fallback 初期値
 * @returns {number} 音量
 */
function readVolume(name, fallback) {
  const v = Storage.get(name);
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : fallback;
}

/**
 * BGM の音量を答える。壊れた値は初期値。状態は変えない。
 * @returns {number} 0〜1
 */
export function bgmVolume() {
  return readVolume('bgmVolume', SETTINGS_STORAGE.defaults.bgmVolume);
}

/**
 * 効果音の音量を答える。壊れた値は初期値。状態は変えない。
 * @returns {number} 0〜1
 */
export function seVolume() {
  return readVolume('seVolume', SETTINGS_STORAGE.defaults.seVolume);
}

/**
 * 攻防の演出の速さの識別子を答える。表にない値は初期値。状態は変えない。
 * @returns {string} `BATTLE_SPEEDS` の id
 */
export function battleSpeedId() {
  const id = Storage.get('battleSpeed');
  return BATTLE_SPEEDS.some((s) => s.id === id) ? id : DEFAULT_BATTLE_SPEED;
}

/**
 * 攻防の演出の速さの倍率を答える。
 * @returns {number} 倍率
 */
export function battleSpeedRate() {
  const id = battleSpeedId();
  return BATTLE_SPEEDS.find((s) => s.id === id).rate;
}

/**
 * BGM の音量を保存し、その場で反映する。
 * @param {number} v 0〜1
 * @returns {void}
 */
export function writeBgmVolume(v) {
  Storage.set('bgmVolume', v);
  setBgmVolume(v);
}

/**
 * 効果音の音量を保存し、その場で反映する。
 * @param {number} v 0〜1
 * @returns {void}
 */
export function writeSeVolume(v) {
  Storage.set('seVolume', v);
  setSeVolume(v);
}

/**
 * 攻防の演出の速さを保存する。表にない識別子は何もしない。
 * @param {string} id `BATTLE_SPEEDS` の id
 * @returns {void}
 */
export function writeBattleSpeed(id) {
  if (!BATTLE_SPEEDS.some((s) => s.id === id)) return;
  Storage.set('battleSpeed', id);
}

/**
 * 起動時に1回、保存された音量を Sound に反映する（Storage.open の後に呼ぶ）。
 * @returns {void}
 */
export function applySoundSettings() {
  setBgmVolume(bgmVolume());
  setSeVolume(seVolume());
}
