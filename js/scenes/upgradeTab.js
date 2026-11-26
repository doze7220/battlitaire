/**
 * 責務: メニューの「強化」タブ（MenuTab）を作り、取った強化の行をスクロールする領域に並べる（盤面だけ。読むだけで状態は変えない）。
 * 行の文字は描くたびにゲームの状態から読む（DEBUG タブで強化を変えても開いたままの窓に出る）。
 */
import { MENU_LAYOUT } from '../view/menuLayout.js';
import { MENU_TEXT } from '../view/menuText.js';
import { takenUpgradeLines } from '../view/upgradeText.js';
import { upgradeIds, takenUpgradeList } from '../rules/upgrades.js';

/**
 * 「強化」タブに、スクロールする領域と行を足す。行の数は強化の種類の数（最低 1）。
 * @param {import('../rules/Game.js').Game} game ゲーム（読むだけ）
 * @param {object} tab addTabs が返したタブのオブジェクト
 * @returns {void}
 */
function buildUpgradeTab(game, tab) {
  const area = tab.addScroll(MENU_LAYOUT.upgradeArea);
  const line = MENU_LAYOUT.upgradeLine;
  const rowCount = Math.max(1, upgradeIds(game.config).length);
  for (let i = 0; i < rowCount; i++) {
    area.addValue({
      x: 0,
      y: line.pitch * i,
      width: line.width,
      height: line.height,
      label: () => takenUpgradeLines(takenUpgradeList(game.config, game.upgrades))[i] ?? '',
      read: () => '',
    });
  }
}

/**
 * 「強化」タブを作る。
 * @param {import('../rules/Game.js').Game} game 盤面のゲーム（行の文字を描くたびに読む）
 * @returns {import('./MenuScene.js').MenuTab} 「強化」タブ（名前と build）
 */
export function createUpgradeTab(game) {
  return { label: MENU_TEXT.tabs.upgrades, build: (tab) => buildUpgradeTab(game, tab) };
}
