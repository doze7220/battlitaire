/**
 * 責務: タイトル画面に出す文字（ゲーム名・ボタン「はじめる」「遊び方」の文字）を定数として持つ。
 * 攻防・決着の文字は battleText.js に置き、ここには混ぜない。
 */

/**
 * タイトル画面の文字のまとめ。
 * @type {Readonly<{ gameName: string, start: string, howTo: string }>}
 */
export const TITLE_TEXT = Object.freeze({
  gameName: 'バトリティア',
  start: 'はじめる',
  howTo: '遊び方',
});
