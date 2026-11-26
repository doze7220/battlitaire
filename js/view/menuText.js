/**
 * 責務: メニューの窓の文字（窓のタイトル・タブの名前・項目名）を凍結した定数で持ち、音量を百分率の文字にする。
 * 状態は持たず、何も import しない。
 */

/**
 * メニューの窓の文字（凍結）。演出の速さの選択肢の文字は settingsStore.js の BATTLE_SPEEDS に置く。
 * @type {Readonly<{ title: string, tabs: Readonly<{ settings: string, upgrades: string, credits: string }>, bgmVolume: string, seVolume: string, battleSpeed: string }>}
 */
export const MENU_TEXT = Object.freeze({
  title: 'メニュー',
  tabs: Object.freeze({ settings: '設定', upgrades: '強化', credits: 'クレジット' }),
  bgmVolume: 'BGM の音量',
  seVolume: '効果音の音量',
  battleSpeed: '攻防の演出の速さ',
});

/**
 * 音量（0〜1）を百分率の文字にする。
 * @param {number} v 音量
 * @returns {string} 例: 0.5 -> '50%'。有限の数でなければ '--'
 */
export function volumePercentText(v) {
  if (!Number.isFinite(v)) return '--';
  return Math.round(v * 100) + '%';
}
