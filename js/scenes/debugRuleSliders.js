/**
 * 責務: DEBUG タブのルールの値の並び（元に戻すボタン・組の見出し・スライダー）を領域に足し、盤面のデバッグの口につなぐ。
 * スライダーの範囲の表を持つ。ルール層は import せず、値の変更は debug の操作の口でだけ行う。
 */
import { debugRuleLayout } from '../view/debugLayout.js';
import { DEBUG_TEXT, ruleItemText, percentText, wholePercentText } from '../view/debugText.js';

/**
 * ルールの値の種類ごとのスライダーの範囲と刻み。
 * DEBUG タブのスライダーの範囲で、ルールの値ではない。試遊で決め直す値。
 * `config.js` の値を範囲の外にしたら見直す（敵の最大 HP は刻み 2。奇数の値にしたら見直す）。
 * @type {Readonly<Record<string, Readonly<{ min: number, max: number, step: number }>>>}
 */
export const RULE_SLIDERS = Object.freeze({
  castleMaxHp: Object.freeze({ min: 5, max: 200, step: 5 }),
  enemyMaxHp: Object.freeze({ min: 2, max: 300, step: 2 }),
  defense: Object.freeze({ min: 0, max: 20, step: 1 }),
  amount: Object.freeze({ min: 0, max: 50, step: 1 }),
  chance: Object.freeze({ min: 0, max: 1, step: 0.05 }),
  percent: Object.freeze({ min: 0, max: 100, step: 5 }),
  cycleLength: Object.freeze({ min: 1, max: 8, step: 1 }),
  chargeTurns: Object.freeze({ min: 1, max: 5, step: 1 }),
  burn: Object.freeze({ min: 0, max: 10, step: 1 }),
});

/**
 * ルールの値の種類ごとの、スライダーの値の文字の付け方（表にない種類は `Ui` の既定の文字）。
 * @type {Readonly<Record<string, (v: number) => string>>}
 */
const RULE_FORMATS = Object.freeze({
  chance: percentText,
  percent: wholePercentText,
});

/**
 * 1体のポイントの刻みに合わせたスライダーの範囲を求める。unit が null か 1 なら範囲のまま。
 * 2 以上なら刻みは `unit × ceil(step / unit)`、最小・最大はその刻みの倍数に寄せる（奇数を選べない）。
 * @param {{ min: number, max: number, step: number }} range 種類ごとの範囲
 * @param {number|null} unit 1体のポイントの刻み
 * @returns {{ min: number, max: number, step: number }} 範囲と刻み
 */
function unitRange(range, unit) {
  if (unit === null || unit <= 1) return range;
  const step = unit * Math.ceil(range.step / unit);
  return {
    min: Math.ceil(range.min / step) * step,
    max: Math.floor(range.max / step) * step,
    step,
  };
}

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
  const base = RULE_SLIDERS[info.kind];
  if (!base) throw new Error(`unknown rule kind: ${info.kind}`);
  const range = unitRange(base, info.unit);
  const spec = {
    ...rect,
    label: () => ruleItemText(info.name, debug.ruleTiming(id)),
    min: range.min,
    max: range.max,
    step: range.step,
    read: () => debug.ruleValue(id),
    write: (v) => debug.setRuleValue(id, v),
  };
  const format = RULE_FORMATS[info.kind];
  if (format) spec.format = format;
  area.addSlider(spec);
}

/**
 * ルールの値の並び（元に戻すボタン、組ごとの見出しとスライダー）を領域に足す。
 * @param {object} area スクロールする領域のオブジェクト
 * @param {object} debug 盤面のデバッグの口（BoardDebug）
 * @param {number} ruleTop 並びの始まりの y（`createDebugLayout` の `ruleTop`）
 * @returns {void}
 */
export function addRuleSliders(area, debug, ruleTop) {
  const groups = debug.ruleGroups();
  const layout = debugRuleLayout(ruleTop, groups.map((g) => g.itemIds.length));

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
