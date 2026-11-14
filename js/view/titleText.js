/**
 * 責務: タイトル画面に出す文字（ゲーム名・ボタンの文字）を定数として持つ。
 * 攻防・決着の文字は battleText.js に置き、ここには混ぜない。
 */

/**
 * タイトル画面の文字のまとめ。
 * @type {Readonly<{ gameName: string, start: string }>}
 */
export const TITLE_TEXT = Object.freeze({
  gameName: 'バトリティア',
  start: 'はじめる',
});
