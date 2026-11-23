/**
 * 責務: DEBUG タブ（MenuTab）を作り、領域の部品を盤面のデバッグの口（BoardDebug）と FPS の表示につなぐ。
 * FPS の下に焼き付けで描くかのチェックボックス（troopBakes.js の設定）とルールの値の並びを足す。ルール層は import しない。
 */
import { Engine } from 'oz';
import { addRuleSliders } from './debugRuleSliders.js';
import { DEBUG_LAYOUT, DEBUG_FPS_POSITION } from '../view/debugLayout.js';
import { DEBUG_TEXT, intentChoiceText, hpText, fpsText } from '../view/debugText.js';
import { troopBakesEnabled, setTroopBakesEnabled } from '../view/troopBakes.js';

/**
 * 兵の数のスライダーの範囲。1種類あたりの理論上の最大
 * （REQ の根拠: 7 枚の束を放つ +34 → 5 枚を置いて放つ +29）。
 * `config.js` の値（数字の範囲・束の補正・行動回数・力こぶの換算）を変えたら見直す。
 * DEBUG タブのスライダーの範囲で、ルールの値ではない。
 * @type {Readonly<{ min: number, max: number, step: number }>}
 */
export const TROOP_SLIDER = Object.freeze({ min: 0, max: 63, step: 1 });

/**
 * 「1 にする」ボタンの HP の値。
 * @type {number}
 */
export const HP_LOW = 1;

/** 兵のスライダーを足す種類の並び（DEBUG_LAYOUT.troopSliders の項目の順）。 */
const TROOP_KINDS = Object.freeze(['attack', 'defense', 'heal']);

/**
 * HP の表示と「1 にする」「満タンにする」のボタンを足す。
 * @param {object} area スクロールする領域のオブジェクト
 * @param {object} spec 配置・文字・操作の口
 * @param {{ x: number, y: number, width: number, height: number }} spec.value 表示の矩形
 * @param {{ one: object, full: object }} spec.buttons ボタンの矩形
 * @param {string} spec.label 表示の項目名
 * @param {() => { hp: number, maxHp: number }} spec.target HP を持つものを返す（読むだけ）
 * @param {(hp: number) => void} spec.setHp HP を指定する操作の口
 * @returns {void}
 */
function addHpControls(area, { value, buttons, label, target, setHp }) {
  area.addValue({
    ...value,
    label,
    read: target,
    format: (t) => hpText(t.hp, t.maxHp),
  });
  area.addButton({
    ...buttons.one,
    label: DEBUG_TEXT.hpToOne,
    onPress: () => setHp(HP_LOW),
  });
  area.addButton({
    ...buttons.full,
    label: DEBUG_TEXT.hpToFull,
    onPress: () => setHp(target().maxHp),
  });
}

/**
 * DEBUG タブの中身を足す。FPS の下に「焼き付けで描く」のチェックボックス（troopBakes.js の設定につなぐ）、
 * 最後にルールの値の並び（debugRuleSliders.js）を足す。
 * @param {object} debug 盤面のデバッグの口（BoardDebug）
 * @param {object} tab addTabs が返したタブのオブジェクト
 * @returns {void}
 */
function buildDebugTab(debug, tab) {
  const area = tab.addScroll(DEBUG_LAYOUT.area);

  area.addValue({
    ...DEBUG_LAYOUT.troopNote,
    label: () => (debug.troopsLocked() ? DEBUG_TEXT.troopsLocked : DEBUG_TEXT.troopsHeading),
    read: () => '',
  });
  for (const kind of TROOP_KINDS) {
    area.addSlider({
      ...DEBUG_LAYOUT.troopSliders[kind],
      label: DEBUG_TEXT.troops[kind],
      min: TROOP_SLIDER.min,
      max: TROOP_SLIDER.max,
      step: TROOP_SLIDER.step,
      read: () => debug.troopCount(kind),
      write: (v) => debug.setTroops(kind, v),
    });
  }

  area.addValue({ ...DEBUG_LAYOUT.enemyLabel, label: DEBUG_TEXT.enemy, read: () => '' });
  area.addChoices({
    ...DEBUG_LAYOUT.enemyChoices,
    choices: debug.enemyChoices().map((e) => ({ label: e.name, value: e.index })),
    read: () => debug.enemyIndex(),
    write: (v) => debug.switchEnemy(v),
  });

  area.addValue({ ...DEBUG_LAYOUT.intentLabel, label: DEBUG_TEXT.intent, read: () => '' });
  const slots = Array.from({ length: debug.intentSlotCount() }, (_, i) => i);
  area.addChoices({
    ...DEBUG_LAYOUT.intentChoices,
    choices: slots.map((i) => ({
      label: () => {
        const id = debug.intentChoiceAt(i);
        return id === null ? DEBUG_TEXT.noChoice : intentChoiceText(id);
      },
      value: i,
    })),
    read: () => debug.selectedIntentSlot(),
    write: (i) => debug.chooseIntentSlot(i),
  });

  addHpControls(area, {
    value: DEBUG_LAYOUT.castleHp,
    buttons: DEBUG_LAYOUT.castleButtons,
    label: DEBUG_TEXT.castleHp,
    target: () => debug.castle(),
    setHp: (hp) => debug.setCastleHp(hp),
  });
  addHpControls(area, {
    value: DEBUG_LAYOUT.enemyHp,
    buttons: DEBUG_LAYOUT.enemyButtons,
    label: DEBUG_TEXT.enemyHp,
    target: () => debug.enemy(),
    setHp: (hp) => debug.setEnemyHp(hp),
  });

  area.addCheckbox({
    ...DEBUG_LAYOUT.fpsCheckbox,
    label: DEBUG_TEXT.fpsVisible,
    read: () => Engine.fpsVisible,
    write: (on) => {
      Engine.fpsPosition = DEBUG_FPS_POSITION;
      Engine.fpsVisible = on;
    },
  });
  area.addValue({
    ...DEBUG_LAYOUT.fpsValue,
    label: DEBUG_TEXT.fps,
    read: () => Engine.fps,
    format: fpsText,
  });

  area.addCheckbox({
    ...DEBUG_LAYOUT.bakeCheckbox,
    label: DEBUG_TEXT.bakedDrawing,
    read: () => troopBakesEnabled(),
    write: (on) => setTroopBakesEnabled(on),
  });

  addRuleSliders(area, debug);
}

/**
 * DEBUG タブを作る。
 * @param {import('./boardDebug.js').BoardDebug} debug 盤面のデバッグの口
 * @returns {import('./MenuScene.js').MenuTab} 「DEBUG」タブ（名前と build）
 */
export function createDebugTab(debug) {
  return { label: DEBUG_TEXT.tab, build: (tab) => buildDebugTab(debug, tab) };
}
