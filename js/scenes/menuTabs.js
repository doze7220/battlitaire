/**
 * 責務: メニューの標準のタブ（「設定」「クレジット」）の一覧を作り、
 * 各タブの部品を設定の読み書きの口（settingsStore.js）につないで足す。
 */
import { MENU_LAYOUT } from '../view/menuLayout.js';
import { MENU_TEXT, volumePercentText } from '../view/menuText.js';
import { CREDIT_LINES } from '../view/creditText.js';
import {
  VOLUME_RANGE,
  BATTLE_SPEEDS,
  bgmVolume,
  seVolume,
  battleSpeedId,
  writeBgmVolume,
  writeSeVolume,
  writeBattleSpeed,
} from './settingsStore.js';
import { playSeVolumeCheckSe } from './soundCues.js';

/**
 * 「設定」タブに部品を足す。
 * @param {object} tab addTabs が返したタブのオブジェクト
 * @returns {void}
 */
function buildSettingsTab(tab) {
  tab.addSlider({
    ...MENU_LAYOUT.bgmSlider,
    label: MENU_TEXT.bgmVolume,
    min: VOLUME_RANGE.min,
    max: VOLUME_RANGE.max,
    step: VOLUME_RANGE.step,
    read: bgmVolume,
    write: writeBgmVolume,
    format: volumePercentText,
  });
  tab.addSlider({
    ...MENU_LAYOUT.seSlider,
    label: MENU_TEXT.seVolume,
    min: VOLUME_RANGE.min,
    max: VOLUME_RANGE.max,
    step: VOLUME_RANGE.step,
    read: seVolume,
    write: (v) => {
      writeSeVolume(v);
      playSeVolumeCheckSe();
    },
    format: volumePercentText,
  });
  tab.addValue({
    ...MENU_LAYOUT.speedLabel,
    label: MENU_TEXT.battleSpeed,
    read: () => '',
  });
  tab.addChoices({
    ...MENU_LAYOUT.speedChoices,
    choices: BATTLE_SPEEDS.map((s) => ({ label: s.label, value: s.id })),
    read: battleSpeedId,
    write: writeBattleSpeed,
  });
}

/**
 * 「クレジット」タブに、スクロールする領域と行を足す。
 * @param {object} tab addTabs が返したタブのオブジェクト
 * @returns {void}
 */
function buildCreditsTab(tab) {
  const area = tab.addScroll(MENU_LAYOUT.creditArea);
  const line = MENU_LAYOUT.creditLine;
  CREDIT_LINES.forEach((text, i) => {
    area.addValue({
      x: 0,
      y: line.pitch * i,
      width: line.width,
      height: line.height,
      label: text,
      read: () => '',
    });
  });
}

/**
 * メニューの標準のタブの一覧（「設定」「クレジット」）を作る。
 * 後で DEBUG タブなどを足すときは、呼ぶ側（main.js）がこの配列の後ろに足す。
 * @returns {import('./MenuScene.js').MenuTab[]} 毎回新しい配列
 */
export function createMenuTabs() {
  return [
    { label: MENU_TEXT.tabs.settings, build: buildSettingsTab },
    { label: MENU_TEXT.tabs.credits, build: buildCreditsTab },
  ];
}
