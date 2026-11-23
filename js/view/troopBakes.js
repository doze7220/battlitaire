/**
 * 兵の見た目の焼き付け（キャンバスキャッシュ）の入れ物を作り・引き・手放すことと、焼き付けで描くかの設定を持つ。
 * どちらも描き方の資源・設定でゲームの状態ではない。`CanvasCache` を呼ぶのはこのファイルだけ。
 */
import { CanvasCache } from 'oz';

/** 大きさの照合の許容差（同じ値から計算した数どうしの比較用）。 */
const SIZE_EPSILON = 1e-6;

/**
 * 焼き付ける1枚の指定。
 * @typedef {Object} TroopBakeEntry
 * @property {string} look 焼き付けの識別子
 * @property {number} size 描く大きさ（論理 px）
 * @property {function(CanvasRenderingContext2D): void} source 焼き付ける描く処理（足元が原点）
 * @property {{minX: number, minY: number, maxX: number, maxY: number}} bounds 焼き付ける範囲（論理 px。足元が原点）
 */

/**
 * 盤面のシーンが `init` で作り `destroy` で手放す描き方の資源。ゲームの状態ではない。
 */
export class TroopBakeSet {
  /**
   * 指定のすべてを焼き付ける。途中で例外が出たら、作った分を手放してから投げ直す。
   * @param {TroopBakeEntry[]} entries 焼き付ける指定の一覧
   */
  constructor(entries) {
    /** @type {Map<string, Array<{size: number, bake: *}>>} */
    this.bakes = new Map();
    /** @type {boolean} 焼き付けで描くか */
    this.enabled = true;
    /** @type {boolean} 手放したか */
    this.disposed = false;
    try {
      for (const entry of entries) {
        const bake = CanvasCache.create(entry.source, { bounds: entry.bounds, scale: 1 });
        let list = this.bakes.get(entry.look);
        if (list === undefined) {
          list = [];
          this.bakes.set(entry.look, list);
        }
        list.push({ size: entry.size, bake });
      }
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  /**
   * 識別子と大きさの焼き付けを引く。状態を変えない。
   * @param {string} look 焼き付けの識別子
   * @param {number} size 描く大きさ
   * @returns {*|null} 焼き付け。手放した・設定が外れている・なければ null
   */
  find(look, size) {
    if (this.disposed || !this.enabled) return null;
    const list = this.bakes.get(look);
    if (list === undefined) return null;
    for (let i = 0; i < list.length; i++) {
      if (Math.abs(list[i].size - size) <= SIZE_EPSILON) return list[i].bake;
    }
    return null;
  }

  /**
   * すべての焼き付けを手放す。`current` がこの入れ物なら `null` に戻す。2回目以降は何もしない。
   * @returns {void}
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const list of this.bakes.values()) {
      for (const item of list) item.bake.dispose();
    }
    this.bakes.clear();
    if (current === this) current = null;
  }
}

/**
 * いま使っている入れ物。`openTroopBakes` で決まり、その入れ物の `dispose()` で `null` に戻る。
 * 描き方の資源でゲームの状態ではない。
 * @type {TroopBakeSet|null}
 */
let current = null;

/**
 * 焼き付けの入れ物を作って、いま使っている入れ物にする。`Engine.start` の後、シーンの `init` から呼ぶこと。
 * @param {TroopBakeEntry[]} entries 焼き付ける指定の一覧
 * @returns {TroopBakeSet} 作った入れ物（手放すときは `dispose()`）
 */
export function openTroopBakes(entries) {
  current = new TroopBakeSet(entries);
  return current;
}

/**
 * いま使っている入れ物から、識別子と大きさの焼き付けを引く。描くたびに呼ばれるので、状態を変えず、オブジェクトを作らない。
 * @param {string} look 焼き付けの識別子
 * @param {number} size 描く大きさ
 * @returns {*|null} 焼き付け（`draw(ctx)` を持つ）。入れ物がない・設定が外れている・ない大きさなら null
 */
export function findTroopBake(look, size) {
  if (current === null) return null;
  return current.find(look, size);
}

/**
 * 焼き付けで描く設定が入っているか。読むだけ。
 * @returns {boolean} いま使っている入れ物があり、その設定が入っていれば true
 */
export function troopBakesEnabled() {
  return current !== null && current.enabled;
}

/**
 * 焼き付けで描く設定を変える（入れ物がなければ何もしない）。
 * 呼ぶのは DEBUG タブのチェックボックスの `write` の中だけ。`draw` の中から呼ばない。
 * @param {boolean} on 焼き付けで描くなら true
 * @returns {void}
 */
export function setTroopBakesEnabled(on) {
  if (current !== null) current.enabled = Boolean(on);
}
