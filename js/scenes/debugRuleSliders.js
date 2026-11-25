/**
 * 責務: DEBUG タブのルールの値の並び（元に戻すボタン・組の見出し・スライダー）を領域に足し、盤面のデバッグの口につなぐ。
 * スライダーの範囲の表を持つ。ルール層は import せず、値の変更は debug の操作の口でだけ行う。
 */
import { debugRuleLayout } from '../view/debugLayout.js';
import { DEBUG_TEXT, ruleItemText, percentText } from '../view/debugText.js';

/**
 * ルールの値の種類ごとのスライダーの範囲と刻み。
 * DEBUG タブのスライダーの範囲で、ルールの値ではない。試遊で決め直す値。
 * `config.js` の値を範囲の外にしたら見直す。
 * @type {Readonly<Record<string, Readonly<{ min: number, max: number, step: number }>>>}
 */
export const RULE_SLIDERS = Object.freeze({
  castleMaxHp: Object.freeze({ min: 5, max: 200, step: 5 }),
  enemyMaxHp: Object.freeze({ min: 5, max: 300, step: 5 }),
  armor: Object.freeze({ min: 0, max: 20, step: 1 }),
  amount: Object.freeze({ min: 0, max: 50, step: 1 }),
  chance: Object.freeze({ min: 0, max: 1, step: 0.05 }),
  cycleLength: Object.freeze({ min: 1, max: 8, step: 1 }),
  burn: Object.freeze({ min: 0, max: 10, step: 1 }),
});

/**
 * ルールの値のスライダーを1本足す。
 * @param {object} area スクロールする領域のオブジェクト
 * @param {object} debug 盤面のデバッグの口（BoardDebug）
 * @param {string} id 項目の識別子
 * @param {object} rect スライダーの矩形
 * @returns {void}
 */
function addRuleSlider(area, debug, id, rect) {
  const info = debug.ruleItemInfo(id);
  const range = RULE_SLIDERS[info.kind];
  if (!range) throw new Error(`unknown rule kind: ${info.kind}`);
  const spec = {
    ...rect,
    label: () => ruleItemText(info.name, debug.ruleTiming(id)),
    min: range.min,
    max: range.max,
    step: range.step,
    read: () => debug.ruleValue(id),
    write: (v) => debug.setRuleValue(id, v),
  };
  if (info.kind === 'chance') spec.format = percentText;
  area.addSlider(spec);
}

/**
 * ルールの値の並び（元に戻すボタン、組ごとの見出しとスライダー）を領域に足す。
 * @param {object} area スクロールする領域のオブジェクト
 * @param {object} debug 盤面のデバッグの口（BoardDebug）
 * @returns {void}
 */
export function addRuleSliders(area, debug) {
  const groups = debug.ruleGroups();
  const layout = debugRuleLayout(groups.map((g) => g.itemIds.length));

  area.addButton({
    ...layout.resetButton,
    label: DEBUG_TEXT.rulesReset,
    onPress: () => debug.resetRuleValues(),
  });
  groups.forEach((group, i) => {
    const placed = layout.groups[i];
    area.addValue({
      ...placed.heading,
      label: group.enemyName === null ? DEBUG_TEXT.rulesCastle : group.enemyName,
      read: () => '',
    });
    group.itemIds.forEach((id, j) => addRuleSlider(area, debug, id, placed.sliders[j]));
  });
}
