/**
 * 責務: DEBUG タブ（MenuTab）を作り、領域の部品を盤面のデバッグの口（BoardDebug）と FPS の表示につなぐ。
 * 強化の段・FPS の下に焼き付けで描くかのチェックボックス（troopBakes.js の設定）とルールの値の並びを足す。ルール層は import しない。
 */
import { Engine } from 'oz';
import { addRuleSliders } from './debugRuleSliders.js';
import { createDebugLayout, DEBUG_FPS_POSITION } from '../view/debugLayout.js';
import { DEBUG_TEXT, intentChoiceText, hpText, fpsText, stageStepText, upgradeAddText } from '../view/debugText.js';
import { upgradeTextOf } from '../view/upgradeText.js';
import { troopBakesEnabled, setTroopBakesEnabled } from '../view/troopBakes.js';

/**
 * 兵の数のスライダーの範囲。1種類あたりの理論上の最大
 * （根拠: 7 枚の束を放つ 28 + 6 + 4スートそろい 1 = 35 → 5 枚を置いて放つ 25 + 4 + 1 = 30。合計 65。
 * 強化の自動兵士の分を足しても届くように 99 にした）。
 * `config.js` の値（数字の範囲・束の補正・行動回数・力こぶの換算・4スートそろいの量 `allSuitsBonus`・自動兵士の強化）を変えたら見直す。
 * DEBUG タブのスライダーの範囲で、ルールの値ではない。
 * @type {Readonly<{ min: number, max: number, step: number }>}
 */
export const TROOP_SLIDER = Object.freeze({ min: 0, max: 99, step: 1 });

/**
 * 戦闘のターンの番号のスライダーの範囲。DEBUG タブのスライダーの範囲で、ルールの値ではない。
 * 疲弊の始まり（21・26 ターン目）を試せる範囲。ふつうに 31 ターン目以降へ進んだときは、つまみが端に描かれ数字は値のまま出る。
 * @type {Readonly<{ min: number, max: number, step: number }>}
 */
export const TURN_SLIDER = Object.freeze({ min: 1, max: 30, step: 1 });

/**
 * 「1 にする」ボタンの HP の値。
 * @type {number}
 */
export const HP_LOW = 1;

/**
 * ステージを移るボタンの移る数（`createDebugLayout` の `stageButtons` の順）。DEBUG タブのボタンで、ルールの値ではない。
 * @type {readonly number[]}
 */
const STAGE_STEPS = Object.freeze([-5, -1, 1, 5]);

/** 兵のスライダーを足す種類の並び（`createDebugLayout` の `troopSliders` の項目の順）。 */
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
 * @param {() => void} close メニューの窓を閉じる関数（「3択を出す」が成り立ったときに呼ぶ）
 * @returns {void}
 */
function buildDebugTab(debug, tab, close) {
  const layout = createDebugLayout(debug.enemyChoices().length, debug.upgradeIds().length);
  const area = tab.addScroll(layout.area);

  area.addValue({
    ...layout.troopNote,
    label: () => (debug.troopsLocked() ? DEBUG_TEXT.troopsLocked : DEBUG_TEXT.troopsHeading),
    read: () => '',
  });
  for (const kind of TROOP_KINDS) {
    area.addSlider({
      ...layout.troopSliders[kind],
      label: DEBUG_TEXT.troops[kind],
      min: TROOP_SLIDER.min,
      max: TROOP_SLIDER.max,
      step: TROOP_SLIDER.step,
      read: () => debug.troopCount(kind),
      write: (v) => debug.setTroops(kind, v),
    });
  }

  area.addValue({
    ...layout.stageLabel,
    label: DEBUG_TEXT.stage,
    read: () => debug.stageNumber(),
    format: (n) => String(n),
  });
  STAGE_STEPS.forEach((delta, i) => {
    area.addButton({
      ...layout.stageButtons[i],
      label: stageStepText(delta),
      onPress: () => debug.moveStage(delta),
    });
  });

  area.addValue({ ...layout.enemyLabel, label: DEBUG_TEXT.enemy, read: () => '' });
  const enemies = debug.enemyChoices();
  for (const row of layout.enemyRows) {
    area.addChoices({
      ...row.rect,
      choices: enemies.slice(row.from, row.to).map((e) => ({ label: e.name, value: e.typeId })),
      read: () => debug.enemyTypeId(),
      write: (v) => debug.switchEnemy(v),
    });
  }

  area.addValue({ ...layout.intentLabel, label: DEBUG_TEXT.intent, read: () => '' });
  const slots = Array.from({ length: debug.intentSlotCount() }, (_, i) => i);
  area.addChoices({
    ...layout.intentChoices,
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

  area.addSlider({
    ...layout.battleTurn,
    label: DEBUG_TEXT.battleTurn,
    min: TURN_SLIDER.min,
    max: TURN_SLIDER.max,
    step: TURN_SLIDER.step,
    read: () => debug.battleTurn(),
    write: (v) => debug.setBattleTurn(v),
  });

  addHpControls(area, {
    value: layout.castleHp,
    buttons: layout.castleButtons,
    label: DEBUG_TEXT.castleHp,
    target: () => debug.castle(),
    setHp: (hp) => debug.setCastleHp(hp),
  });
  addHpControls(area, {
    value: layout.enemyHp,
    buttons: layout.enemyButtons,
    label: DEBUG_TEXT.enemyHp,
    target: () => debug.enemy(),
    setHp: (hp) => debug.setEnemyHp(hp),
  });

  area.addValue({ ...layout.upgradeLabel, label: DEBUG_TEXT.upgrades, read: () => '' });
  area.addButton({
    ...layout.upgradeButtons.offer,
    label: DEBUG_TEXT.upgradeOffer,
    onPress: () => {
      if (debug.openUpgradeChoice()) close();
    },
  });
  area.addButton({
    ...layout.upgradeButtons.clear,
    label: DEBUG_TEXT.upgradeClear,
    onPress: () => debug.clearUpgrades(),
  });
  debug.upgradeIds().forEach((id, i) => {
    area.addButton({
      ...layout.upgradeAddButtons[i],
      label: () => upgradeAddText(upgradeTextOf(id).name, debug.upgradeCount(id)),
      onPress: () => debug.addUpgrade(id),
    });
  });

  area.addCheckbox({
    ...layout.fpsCheckbox,
    label: DEBUG_TEXT.fpsVisible,
    read: () => Engine.fpsVisible,
    write: (on) => {
      Engine.fpsPosition = DEBUG_FPS_POSITION;
      Engine.fpsVisible = on;
    },
  });
  area.addValue({
    ...layout.fpsValue,
    label: DEBUG_TEXT.fps,
    read: () => Engine.fps,
    format: fpsText,
  });

  area.addCheckbox({
    ...layout.bakeCheckbox,
    label: DEBUG_TEXT.bakedDrawing,
    read: () => troopBakesEnabled(),
    write: (on) => setTroopBakesEnabled(on),
  });

  addRuleSliders(area, debug, layout.ruleTop);
}

/**
 * DEBUG タブを作る。
 * @param {import('./boardDebug.js').BoardDebug} debug 盤面のデバッグの口
 * @returns {import('./MenuScene.js').MenuTab} 「DEBUG」タブ（名前と build）
 */
export function createDebugTab(debug) {
  return { label: DEBUG_TEXT.tab, build: (tab, close) => buildDebugTab(debug, tab, close) };
}
