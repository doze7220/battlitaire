/**
 * 責務: タイトル画面に出す文字（ゲーム名・ボタン「再開」「はじめる」「遊び方」「設定」の文字、「再開」の下の STAGE・TURN の文字、3択の段階の STAGE N・強化を選ぶ の文字）を作る。
 * 攻防・決着の文字は battleText.js に置き、ここには混ぜない。
 */

/**
 * タイトル画面の文字のまとめ。
 * @type {Readonly<{ gameName: string, resume: string, start: string, howTo: string, settings: string }>}
 */
export const TITLE_TEXT = Object.freeze({
  gameName: 'バトリティア',
  resume: '再開',
  start: 'はじめる',
  howTo: '遊び方',
  settings: '設定',
});

/**
 * 「再開」ボタンの下に出す、再開する場所の文字（例: `STAGE 6・TURN 3`）。
 * 3択の段階なら `STAGE 5・強化を選ぶ`（ステージの番号は倒したステージ）。
 * @param {number} stageNumber ステージの番号
 * @param {number} battleTurn 戦闘のターン
 * @param {boolean} [choosing] 3択の段階か（既定 false）
 * @returns {string} 表示する文字
 */
export function resumePlaceText(stageNumber, battleTurn, choosing = false) {
  if (choosing) return `STAGE ${stageNumber}・強化を選ぶ`;
  return `STAGE ${stageNumber}・TURN ${battleTurn}`;
}
