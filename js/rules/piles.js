/** 山札のデータ構造と生成・一番上の取り出し・捨て札からの空の山札の補充を担う。 */

import { createCard } from './card.js';
import { shuffle } from './shuffle.js';

/**
 * 山札。スートごとに1つ。`cards[0]` が一番上。
 * @typedef {Object} Deck
 * @property {string} suit この山札のスートの識別子。
 * @property {import('./card.js').Card[]} cards カードの並び（`[0]` が一番上）。
 */

/**
 * 補充の記録。空の山札に捨て札からカードが戻ったことを表す。
 * @typedef {Object} Refill
 * @property {number} deckIndex 補充された山札の番号。
 * @property {string} suit 補充された山札のスート。
 * @property {number} count 戻ったカードの枚数。
 */

/**
 * 設定に従って山札を作る。`config.suits` の順に、各スートの最小〜最大の数字のカードを
 * 通し番号の ID で作り、混ぜる。
 * @param {{suits: readonly string[], minRank: number, maxRank: number}} config ルールの設定。
 * @param {() => number} random `[0, 1)` の値を返す乱数の関数。
 * @returns {Deck[]} 混ぜ済みの山札（`config.suits` と同じ並び）。
 */
export function createDecks(config, random) {
  let nextId = 0;
  return config.suits.map((suit) => {
    const cards = [];
    for (let rank = config.minRank; rank <= config.maxRank; rank++) {
      cards.push(createCard(nextId++, suit, rank));
    }
    return { suit, cards: shuffle(cards, random) };
  });
}

/**
 * 山札の一番上の1枚を取り除いて返す。
 * @param {Deck} deck 対象の山札（書き換わる）。
 * @returns {import('./card.js').Card|null} 取り除いたカード。空なら `null`。
 */
export function takeTop(deck) {
  return deck.cards.length > 0 ? deck.cards.shift() : null;
}

/**
 * 空の山札ごとに、捨て札からその山札のスートのカードをすべて取り出して混ぜ、山札に入れる。
 * 捨て札に該当スートのカードがなければ補充は起きない。
 * @param {Deck[]} decks 山札（空のものに補充され、書き換わる）。
 * @param {import('./card.js').Card[]} discard 捨て札（取り出した分が取り除かれる）。
 * @param {() => number} random `[0, 1)` の値を返す乱数の関数。
 * @returns {Refill[]} 補充が起きた山札ごとの記録。
 */
export function refillEmptyDecks(decks, discard, random) {
  /** @type {Refill[]} */
  const refills = [];
  decks.forEach((deck, deckIndex) => {
    if (deck.cards.length > 0) return;
    const taken = [];
    for (let i = discard.length - 1; i >= 0; i--) {
      if (discard[i].suit === deck.suit) taken.push(...discard.splice(i, 1));
    }
    if (taken.length === 0) return;
    deck.cards = shuffle(taken, random);
    refills.push({ deckIndex, suit: deck.suit, count: taken.length });
  });
  return refills;
}
