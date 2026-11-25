/**
 * 責務: ステージの番号から敵の加算量（HP の百分率・攻撃・防御）を求める計算と、加算後の最大 HP の計算（純粋関数。ルール層）。
 * 加算量を求めるのはこのファイルだけ。
 */

/**
 * ステージの加算量。
 * @typedef {Object} StageBonus
 * @property {number} hpPercent 最大 HP に足す百分率（0 以上の整数）
 * @property {number} attack 攻撃の値に足す量（0 以上の整数）
 * @property {number} defense 防御の量に足す量（0 以上の整数）
 */

/**
 * ステージの番号から加算量を求める（前のステージを順に計算しない）。
 * 章ごとに、その章に入る「進んだ先のステージ」（2 以上）の数を数え、章の加算量に掛けて足す。最後の章の加算量はそれより先の章でも使う。
 * @param {import('./config.js').StageGrowthSpec} stageGrowth 章ごとの加算量の設定
 * @param {number} stageNumber ステージの番号（1 以上の整数）
 * @returns {StageBonus} 加算量（どれも 0 以上の整数。攻撃・防御は合計の小数を切り捨てる）
 */
export function stageBonusOf(stageGrowth, stageNumber) {
  const length = stageGrowth.stagesPerChapter;
  const chapters = stageGrowth.chapters;
  let hpPercent = 0;
  let attack = 0;
  let defense = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    const first = i * length + 1;
    const last = i === chapters.length - 1 ? stageNumber : Math.min(stageNumber, (i + 1) * length);
    const count = Math.max(0, last - Math.max(first, 2) + 1);
    hpPercent += chapters[i].hpPercent * count;
    attack += chapters[i].attack * count;
    defense += chapters[i].defense * count;
  }
  return {
    hpPercent,
    attack: Math.floor(Math.round(attack * 100) / 100),
    defense: Math.floor(Math.round(defense * 100) / 100),
  };
}

/**
 * 加算後の最大 HP を求める。
 * @param {number} baseMaxHp 設定の最大 HP
 * @param {StageBonus} bonus ステージの加算量
 * @returns {number} 加算後の最大 HP（切り捨て）
 */
export function grownMaxHp(baseMaxHp, bonus) {
  return Math.floor((baseMaxHp * (100 + bonus.hpPercent)) / 100);
}
