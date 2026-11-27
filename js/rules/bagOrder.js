/** 種・袋の列・「同じ★の中の何番目か」から、くじ袋の決まりで中身の番号を決める純粋関数（袋の大きさずつの区切りの中は全部が1回ずつ・入れ直した直後は直前と違う・最初の袋の先頭は固定できる）。
 * 前の袋を順に計算せず、隣の袋の最後だけを直接求める。乱数は呼ばない。 */
import { seededIndex, STREAM } from './seededIndex.js';

/**
 * 袋の列の見分け（種と、同じ種の中のどの袋の列か）。
 * @typedef {Object} BagLane
 * @property {number} seed 種（整数）。
 * @property {number} lane 袋の列の番号（0 以上 lanes 未満の整数）。
 * @property {number} lanes 袋の列の数（1 以上の整数）。
 */

/**
 * 袋ごと・列ごとに別の番号になる鍵を求める（★2と★3の袋が同じ並びにならない）。
 * @param {BagLane} lane 袋の列の見分け。
 * @param {number} bag 袋の番号（0 以上）。
 * @returns {number} 鍵の番号。
 */
function keyOf(lane, bag) {
  return bag * lane.lanes + lane.lane;
}

/**
 * 袋の最後の中身を決める。大きさ 2 の袋は最後をいつも bag 0 と同じにする
 * （最後が袋ごとに変わると次の袋の最初の候補がなくなるため。3 は「最後を袋ごとに変えてよい大きさ」の決まりの形で、ルールの調整値ではない）。
 * bag 0 では最初の袋の先頭に固定する中身を最後にしない。
 * @param {BagLane} lane 袋の列の見分け。
 * @param {number} bag 袋の番号（0 以上）。
 * @param {number} size 袋の大きさ（2 以上）。
 * @param {number} firstIndex 最初の袋の先頭の中身の番号（なければ -1）。
 * @returns {number} 中身の番号。
 */
function lastOfBag(lane, bag, size, firstIndex) {
  const b = size >= 3 ? bag : 0;
  const candidates = [];
  for (let i = 0; i < size; i++) {
    if (!(b === 0 && i === firstIndex)) candidates.push(i);
  }
  return candidates[seededIndex(lane.seed, STREAM.bagLast, keyOf(lane, b), candidates.length)];
}

/**
 * 袋の最初の中身を決める。最初の袋で firstIndex があればそれ。ほかは、この袋の最後と前の袋の最後を除いた候補から選ぶ。
 * @param {BagLane} lane 袋の列の見分け。
 * @param {number} bag 袋の番号（0 以上）。
 * @param {number} size 袋の大きさ（2 以上）。
 * @param {number} firstIndex 最初の袋の先頭の中身の番号（なければ -1）。
 * @returns {number} 中身の番号。
 */
function firstOfBag(lane, bag, size, firstIndex) {
  if (bag === 0 && firstIndex >= 0) return firstIndex;
  const last = lastOfBag(lane, bag, size, firstIndex);
  const prevLast = bag > 0 ? lastOfBag(lane, bag - 1, size, firstIndex) : -1;
  const candidates = [];
  for (let i = 0; i < size; i++) {
    if (i !== last && i !== prevLast) candidates.push(i);
  }
  return candidates[seededIndex(lane.seed, STREAM.bagFirst, keyOf(lane, bag), candidates.length)];
}

/**
 * 「同じ★の中の何番目か」を、袋の番号と袋の何番目かに分ける。
 * @param {number} position 同じ★の中の何番目か（0 以上の整数）。
 * @param {number} size 袋の大きさ（1 以上の整数）。
 * @returns {{bag: number, slot: number}} 袋の番号と袋の何番目か（どちらも 0 から）。
 * @throws {Error} position・size が条件を満たさないとき。
 */
export function bagSlotOf(position, size) {
  if (!Number.isInteger(position) || position < 0) throw new Error('bagSlotOf: position は 0 以上の整数です');
  if (!Number.isInteger(size) || size < 1) throw new Error('bagSlotOf: size は 1 以上の整数です');
  return { bag: Math.floor(position / size), slot: position % size };
}

/**
 * くじ袋の決まりで、「同じ★の中の何番目か」の中身の番号を決める。
 * 袋の中は全部が1回ずつ。入れ直した直後は前の袋の最後と違う（size 2 以上）。
 * @param {BagLane} lane 袋の列の見分け。
 * @param {number} position 同じ★の中の何番目か（0 以上の整数）。
 * @param {number} size 袋の大きさ（1 以上の整数）。
 * @param {number} firstIndex 最初の袋（bag 0）の先頭に固定する中身の番号（なければ -1）。
 * @returns {number} 0 以上 size 未満の中身の番号。
 * @throws {Error} size・firstIndex・position が条件を満たさないとき。
 */
export function bagMemberAt(lane, position, size, firstIndex) {
  if (!Number.isInteger(size) || size < 1) throw new Error('bagMemberAt: size は 1 以上の整数です');
  if (!Number.isInteger(firstIndex) || firstIndex < -1 || firstIndex >= size) {
    throw new Error('bagMemberAt: firstIndex は -1 か 0 以上 size 未満の整数です');
  }
  if (!Number.isInteger(position) || position < 0) throw new Error('bagMemberAt: position は 0 以上の整数です');
  if (size === 1) return 0;
  const { bag, slot } = bagSlotOf(position, size);
  const first = firstOfBag(lane, bag, size, firstIndex);
  if (slot === 0) return first;
  const last = lastOfBag(lane, bag, size, firstIndex);
  if (slot === size - 1) return last;
  // 残りを並べ替えて真ん中に置く（Fisher-Yates。番号は袋と手順から決める）。
  const middle = [];
  for (let i = 0; i < size; i++) {
    if (i !== first && i !== last) middle.push(i);
  }
  for (let i = middle.length - 1; i > 0; i--) {
    const j = seededIndex(lane.seed, STREAM.bagMiddle, keyOf(lane, bag) * size + i, i + 1);
    const tmp = middle[i];
    middle[i] = middle[j];
    middle[j] = tmp;
  }
  return middle[slot - 1];
}
