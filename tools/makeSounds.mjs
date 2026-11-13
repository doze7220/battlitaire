/**
 * 仮の効果音（WAV 16bit モノラル）を合成して assets/sounds/ に書き出す開発用スクリプト。
 * 実行: リポジトリの最上位で `node tools/makeSounds.mjs`（外部パッケージ不要）。
 * 同じ名前のファイルは上書きする。ゲームの実行時には読まない（index.html・js/ から import しない）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 標本化周波数（Hz）。 */
const SAMPLE_RATE = 22050;
/** 書き出す最大振幅（0〜1。割れないように 1 未満）。 */
const PEAK = 0.8;
/** 頭の立ち上げの時間（秒）。クリック音を防ぐ。 */
const ATTACK_SEC = 0.005;
/** 終わりの落とし込みの時間（秒）。末尾を必ず 0 に収める。 */
const RELEASE_SEC = 0.005;
/** 勝ち・負け以外の音の長さの上限（秒）。 */
const MAX_SEC = 1;
/** 勝ち・負けの音の長さの上限（秒）。 */
const MAX_SEC_LONG = 2;
/** 長さの上限を長く認める音の名前。 */
const LONG_NAMES = new Set(['win', 'lose']);
/** 書き出し先のフォルダ（スクリプトの位置から求める）。 */
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

const TWO_PI = Math.PI * 2;

/**
 * 正弦波。
 * @param {number} phase 位相（周期を 1 とする）
 * @returns {number} -1〜1
 */
function sine(phase) {
  return Math.sin(phase * TWO_PI);
}

/**
 * 矩形波。
 * @param {number} phase 位相（周期を 1 とする）
 * @returns {number} -1 または 1
 */
function square(phase) {
  return phase - Math.floor(phase) < 0.5 ? 1 : -1;
}

/**
 * 三角波。
 * @param {number} phase 位相（周期を 1 とする）
 * @returns {number} -1〜1
 */
function triangle(phase) {
  const p = phase - Math.floor(phase);
  return p < 0.5 ? p * 4 - 1 : 3 - p * 4;
}

/**
 * 種を固定した疑似乱数（線形合同法）によるノイズの生成関数を作る。
 * @param {number} seed 種
 * @returns {() => number} 呼ぶたびに -1〜1 を返す関数
 */
function makeNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state / 4294967296) * 2 - 1;
  };
}

/**
 * 長さと「時刻 → 値」の関数から標本を作る。頭の立ち上げと終わりの落とし込みを掛ける。
 * @param {number} durationSec 長さ（秒）
 * @param {(t: number) => number} fn 時刻（秒）から値を返す関数（時刻の昇順で呼ばれる）
 * @returns {Float32Array} 標本
 */
function render(durationSec, fn) {
  const n = Math.max(1, Math.round(durationSec * SAMPLE_RATE));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / ATTACK_SEC);
    const release = Math.min(1, (durationSec - t) / RELEASE_SEC);
    out[i] = fn(t) * attack * Math.max(0, release);
  }
  return out;
}

/**
 * 指数の減衰の係数。
 * @param {number} t 時刻（秒）
 * @param {number} rate 減衰の速さ（大きいほど速く消える）
 * @returns {number} 0〜1
 */
function decay(t, rate) {
  return Math.exp(-rate * t);
}

/**
 * 周波数を時間で動かす音。位相を足していくので動かしても連続する。
 * @param {number} durationSec 長さ（秒）
 * @param {number} f0 始めの周波数（Hz）
 * @param {number} f1 終わりの周波数（Hz）
 * @param {(phase: number) => number} wave 波形の関数
 * @param {number} rate 減衰の速さ
 * @returns {Float32Array} 標本
 */
function sweep(durationSec, f0, f1, wave, rate) {
  let phase = 0;
  return render(durationSec, (t) => {
    const f = f0 + (f1 - f0) * (t / durationSec);
    phase += f / SAMPLE_RATE;
    return wave(phase) * decay(t, rate);
  });
}

/**
 * 一定の周波数の音。
 * @param {number} durationSec 長さ（秒）
 * @param {number} freq 周波数（Hz）
 * @param {(phase: number) => number} wave 波形の関数
 * @param {number} rate 減衰の速さ
 * @returns {Float32Array} 標本
 */
function tone(durationSec, freq, wave, rate) {
  return sweep(durationSec, freq, freq, wave, rate);
}

/**
 * ノイズの音（減衰つき）。
 * @param {number} durationSec 長さ（秒）
 * @param {number} seed ノイズの種
 * @param {number} rate 減衰の速さ
 * @returns {Float32Array} 標本
 */
function noiseBurst(durationSec, seed, rate) {
  const noise = makeNoise(seed);
  return render(durationSec, (t) => noise() * decay(t, rate));
}

/**
 * 音を並べる。target の startSec 秒目から source を足し込む（足りない長さは切り捨て）。
 * @param {Float32Array} target 足し込まれる側
 * @param {Float32Array} source 足す音
 * @param {number} startSec 何秒目から足すか
 * @param {number} [gain=1] 足す音の大きさの倍率
 * @returns {Float32Array} target
 */
function mixAt(target, source, startSec, gain = 1) {
  const offset = Math.round(startSec * SAMPLE_RATE);
  for (let i = 0; i < source.length && offset + i < target.length; i++) {
    target[offset + i] += source[i] * gain;
  }
  return target;
}

/**
 * 空の標本を作る。
 * @param {number} durationSec 長さ（秒）
 * @returns {Float32Array} 0 で埋めた標本
 */
function silence(durationSec) {
  return new Float32Array(Math.round(durationSec * SAMPLE_RATE));
}

/**
 * 最大振幅を PEAK に合わせる。
 * @param {Float32Array} samples 標本
 * @returns {Float32Array} 同じ配列（書き換えて返す）
 */
function normalize(samples) {
  let max = 0;
  for (const v of samples) max = Math.max(max, Math.abs(v));
  if (max === 0) return samples;
  const k = PEAK / max;
  for (let i = 0; i < samples.length; i++) samples[i] *= k;
  return samples;
}

/**
 * 音階を順に鳴らす（最後の音は長く伸ばす）。
 * @param {number[]} freqs 周波数の並び（Hz）
 * @param {number} stepSec 音の間隔（秒）
 * @param {number} lastSec 最後の音の長さ（秒）
 * @param {(phase: number) => number} wave 波形の関数
 * @param {number} rate 減衰の速さ
 * @returns {Float32Array} 標本
 */
function melody(freqs, stepSec, lastSec, wave, rate) {
  const total = stepSec * (freqs.length - 1) + lastSec;
  const out = silence(total);
  freqs.forEach((f, i) => {
    const last = i === freqs.length - 1;
    mixAt(out, tone(last ? lastSec : stepSec, f, wave, rate), i * stepSec);
  });
  return out;
}

/**
 * 音の作り方の表（名前 → 標本を作る関数）。名前は js/audio/soundConfig.js の SOUND_FILES と揃える。
 * @type {Record<string, () => Float32Array>}
 */
const RECIPES = {
  // めくる: 高めのノイズの短い「シュッ」
  flip: () => noiseBurst(0.07, 11, 45),
  // 置く: 低い正弦波＋短いクリックの「コトッ」
  place: () => {
    const out = tone(0.09, 150, sine, 30);
    return mixAt(out, noiseBurst(0.01, 23, 300), 0, 0.6);
  },
  // 捨てる: 矩形波の下がる音
  discard: () => sweep(0.15, 400, 200, square, 12),
  // 放つ: 正弦波の上がる音
  release: () => sweep(0.25, 300, 900, sine, 6),
  // 連鎖: 高めの短い「ピッ」
  chain: () => tone(0.06, 1200, sine, 25),
  // 行動終了: 矩形波の2音
  turnEnd: () => melody([523, 784], 0.15, 0.15, square, 8),
  // 相殺: ノイズ＋矩形波の金属的な「ガキン」
  block: () => {
    const out = noiseBurst(0.15, 37, 25);
    return mixAt(out, tone(0.15, 200, square, 18), 0, 0.8);
  },
  // 城へのダメージ: 低い正弦波＋ノイズの「ドン」
  castleHit: () => {
    const out = tone(0.35, 80, sine, 9);
    return mixAt(out, noiseBurst(0.35, 41, 14), 0, 0.5);
  },
  // 敵へのダメージ: 矩形波の下がる音＋ノイズ
  enemyHit: () => {
    const out = sweep(0.2, 300, 150, square, 10);
    return mixAt(out, noiseBurst(0.2, 53, 18), 0, 0.6);
  },
  // 修理: 正弦波の上がる3音
  heal: () => melody([523, 659, 784], 0.12, 0.2, sine, 6),
  // 勝ち: 長調の上がる4音、最後を伸ばす
  win: () => melody([523, 659, 784, 1047], 0.15, 0.75, triangle, 3),
  // 負け: 短調の下がる3音、最後を伸ばす
  lose: () => melody([392, 311, 262], 0.3, 0.9, sine, 2.5)
};

/**
 * 標本を WAV（16bit・モノラル・PCM）のバイト列にする。
 * @param {Float32Array} samples -1〜1 の標本
 * @returns {Buffer} WAV ファイルの中身
 */
function encodeWav(samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // モノラル
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // バイト毎秒
  buf.writeUInt16LE(2, 32); // ブロックサイズ
  buf.writeUInt16LE(16, 34); // ビット数
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2);
  }
  return buf;
}

/**
 * 全部の音を作り、長さを確かめて、書き出す。上限を超える音があれば何も書かずに例外を投げる。
 * @returns {void}
 */
function main() {
  const rendered = Object.entries(RECIPES).map(([name, make]) => {
    const samples = normalize(make());
    const sec = samples.length / SAMPLE_RATE;
    const limit = LONG_NAMES.has(name) ? MAX_SEC_LONG : MAX_SEC;
    if (sec > limit) throw new Error(`${name}: ${sec.toFixed(3)}s は上限 ${limit}s を超えている`);
    return { name, samples, sec };
  });
  mkdirSync(OUT_DIR, { recursive: true });
  for (const { name, samples, sec } of rendered) {
    writeFileSync(join(OUT_DIR, `${name}.wav`), encodeWav(samples));
    console.log(`${name}.wav ${sec.toFixed(3)}s`);
  }
}

main();
