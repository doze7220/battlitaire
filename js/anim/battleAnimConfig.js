/**
 * 攻防の演出の設定（段・兵の動き・弾かれて落ちる距離・燃える札・段取りの間・自動兵士の現れ方・敵の側の兵・打撃・ヒットマークの時間と大きさ、
 * 兵ごとの動きのずれ・攻撃の兵が当たる間隔、攻防のエフェクトの値・呼吸の深さと速さ・敵の絵の呼吸の深さと速さ）を1か所に凍結して持つ。これらの数値は、ほかのファイルに書かない。
 */

/**
 * 攻防の演出の設定。時間の単位はミリ秒。
 * @typedef {Object} BattleAnimConfig
 * @property {number} formMs 敵の回復の段で、回復の量が浮き出て HP が増え始めるまでの時間（ms）。試遊で決め直す。
 * @property {number} marchMs 敵兵・攻撃の兵が、相打ちの相手の前（相手のいない兵は進む先）まで1体ずつ進む時間（ms。前から出る遅れは別）。試遊で決め直す。
 * @property {number} clashMs 相打ちの段で、最後の組が跳ねて落ち始めてから段が終わるまでの間（ms）。試遊で決め直す。
 * @property {number} hitMoveMs 残った兵が城・敵に当たる位置まで1体ずつ移動する時間（ms。着いた兵から跳ねて落ちる）。試遊で決め直す。
 * @property {number} hpMs HP の表示が変わる時間の下限（ms。兵が当たる・城に入る間が長ければそちらに合わせる）。試遊で決め直す。
 * @property {number} fadeMs 敵の回復の量の浮き出しが薄れて消える時間（ms）。試遊で決め直す。
 * @property {number} stepGapMs 段と段の間（ms）。試遊で決め直す。
 * @property {number} endDelayMs 演出が終わってから次のフェーズへ進むまでの間（ms。決着していないとき）。試遊で決め直す。
 * @property {number} burnFlashMs 燃える札1枚が明滅する時間（ms）。試遊で決め直す。
 * @property {number} burnFlyMs 燃える札が捨て札へ飛ぶ時間（ms）。試遊で決め直す。
 * @property {number} burnBlinks 燃える札1枚の明滅の回数（回）。試遊で決め直す。
 * @property {'hop'|'sway'} moveStyle 兵の移動の見せ方（'hop'＝弾む／'sway'＝揺れる）。未知の値は使う側で Error。
 * @property {number} hopHeight 弾む移動の持ち上がりの高さ（px）。試遊で決め直す。
 * @property {number} hopPeriodMs 弾む移動の1回の長さ（ms。脚の長さから回数を決める）。試遊で決め直す。
 * @property {number} swayAngle 揺れる移動の最大の傾き（rad）。試遊で決め直す。
 * @property {number} swayPeriodMs 揺れる移動の1回の長さ（ms。脚の長さから回数を決める）。試遊で決め直す。
 * @property {number} moveStaggerMs 兵が前から順に出るときの、1体ごとの遅れ（ms）。試遊で決め直す。
 * @property {number} moveStaggerMaxMs 前から順に出るときの、遅れの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} moveJitterMs 攻防で兵が出ていく・進む・帰る動きの、兵ごとの動き出しのずれの最大（ms。前からの遅れに足す）。試遊で決め直す。
 * @property {number} speedSpread 兵ごとの動きの長さのばらつきの幅（割合。0.15 なら基準の 0.85〜1.15 倍）。試遊で決め直す。
 * @property {number} popHeight 跳ねて落ちるときの、跳ねる高さ（px）。試遊で決め直す。
 * @property {number} popMs 跳ねて落ちるときに、頂点へ着くまでの時間（ms）。試遊で決め直す。
 * @property {number} fallAccel 跳ねた後に落ちる加速（px/ms²）。試遊で決め直す。
 * @property {number} knockDistance 倒れるとき、跳ね始めから消えるまでに進む向きと逆へ弾かれる横の距離の合計（px）。試遊で決め直す。
 * @property {number} fallStaggerMs 前から順に跳ねて落ちるときの、1組ごとの遅れ（ms）。試遊で決め直す。
 * @property {number} fallStaggerMaxMs 前から順に跳ねて落ちるときの、遅れの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} healMoveMs 修理の兵が城へ入るまで移動する時間（ms）。試遊で決め直す。
 * @property {number} returnMs 使われなかった兵が城へ帰るまで移動する時間（ms）。試遊で決め直す。
 * @property {number} landMs 段取りの間、弾けた玉から出た兵が家へ跳ぶ時間（ms）。試遊で決め直す。
 * @property {number} landStaggerMs 段取りの間、兵が1体ずつ飛び出すときの1体ごとの遅れ（ms）。試遊で決め直す。
 * @property {number} landStaggerMaxMs 段取りの間、飛び出す遅れの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} landJitterMs 段取りの間、兵が家へ跳ぶ動きの、兵ごとの動き出しのずれの最大（ms。前からの遅れに足す）。試遊で決め直す。
 * @property {number} autoTroopAppearMs 自動兵士が（ターンの始まりに）陣地の家へその場で濃くなって現れる時間（ms）。試遊で決め直す。
 * @property {number} enterMs 敵の側の兵（群れの敵の兵・炎）が画面の外・ドラゴンの口から陣地の家まで動く時間（ms。前から出る遅れは別。敵の種類ごとに `ENEMY_PACES` の `moveScale` を掛ける）。試遊で決め直す。
 * @property {number} strikeStaggerMs 飛ぶもののない打撃で、防御の兵・城に1つずつ当たる間隔の上限（ms）。試遊で決め直す。
 * @property {number} strikeStaggerMaxMs 打撃の間隔の広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} hitStaggerMs 攻撃の兵が敵（群れ・絵・シールド）に1体ずつ当たる間隔の上限（ms）。試遊で決め直す。
 * @property {number} hitStaggerMaxMs 敵に当たる間隔の広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} hitMarkMs ヒットマークが出てから消えるまでの時間（ms）。試遊で決め直す。
 * @property {number} hitMarkSize ヒットマークの大きさ（px。絵の長い方の辺）。試遊で決め直す。
 * @property {number} burnFireRatio 燃える札の上に出す炎の大きさの、札の幅に対する割合。試遊で決め直す。
 * @property {number} hitStopMs 普通の当たり1回のヒットストップ（ms）。試遊で決め直す。
 * @property {number} hitStopCapMs 普通の段の中で止まる時間の合計の上限（ms）。試遊で決め直す。
 * @property {number} heavyStopMs 大きな一撃の当たり1回のヒットストップ（ms）。試遊で決め直す。
 * @property {number} heavyStopCapMs 大きな一撃の段の中で止まる時間の合計の上限（ms）。試遊で決め直す。
 * @property {number} flashMs 当たりの白い光が出てから消えるまで（ms）。試遊で決め直す。
 * @property {number} flashSize 白い光の最大の直径（px）。試遊で決め直す。
 * @property {number} damagePopMs 「-1」が浮いて消えるまで（ms）。試遊で決め直す。
 * @property {number} damagePopRise 「-1」が浮き上がる高さ（px）。試遊で決め直す。
 * @property {number} damagePopSize 「-1」の文字の大きさ（px）。試遊で決め直す。
 * @property {number} sparkCount ダメージの当たり1回の粒の数。試遊で決め直す。
 * @property {number} repairSparkCount 修理の兵1体の粒の数。試遊で決め直す。
 * @property {number} sparkMs 粒が消えるまで（ms）。試遊で決め直す。
 * @property {number} sparkSpeed 粒の速さの最大（px/ms）。試遊で決め直す。
 * @property {number} sparkGravity 粒の落ちる加速（px/ms²。修理の粒は上へ）。試遊で決め直す。
 * @property {number} sparkSize 粒の大きさ（px。正方形の辺）。試遊で決め直す。
 * @property {number} sparkMax 同時に見える粒の数の上限。試遊で決め直す。
 * @property {number} shakeAmp 揺れの強さ（px）。試遊で決め直す。
 * @property {number} shakeMs 大きな一撃の当たりから揺れが収まるまで（ms）。試遊で決め直す。
 * @property {number} shakePeriodMs 揺れの1往復（ms）。試遊で決め直す。
 * @property {number} breathDepth 呼吸の深さ（縦の伸び縮みの割合）。試遊で決め直す。
 * @property {number} breathPeriodMs 呼吸の1回（ms）。試遊で決め直す。
 * @property {number} figureBreathDepth 絵の敵の待機の伸び縮みの深さ（縦の伸び縮みの割合）。試遊で決め直す。
 * @property {number} figureBreathPeriodMs 絵の敵の待機の伸び縮みの1回（ms）。試遊で決め直す。
 * @property {number} rushPower 踏み込みの加速の強さ（進み具合の累乗。1 で等速）。試遊で決め直す。
 * @property {number} chargeMs ための段の長さ（ms）。試遊で決め直す。
 * @property {number} chargeLean ための動きで後ろへ反る角度（rad）。試遊で決め直す。
 * @property {number} chargeSwell ための動きで膨らむ割合。試遊で決め直す。
 * @property {number} chargeDim ための段で戦闘の段が暗くなる濃さ（0〜1）。試遊で決め直す。
 * @property {number} fireFlashMs 撃つ瞬間の段の光が消えるまで（ms）。試遊で決め直す。
 * @property {number} fireFlashAlpha 撃つ瞬間の段の光の濃さ（0〜1）。試遊で決め直す。
 * @property {number} dentInMs スライムの体に当たってから、へこみが 0→1 になるまで（ms）。試遊で決め直す。
 * @property {number} dentOutMs へこみが 1→0 に戻るまで（ms。倒れ始めの手前でへこみを消す長さにも使う）。試遊で決め直す。
 * @property {number} dentSquash へこみの量 1 のときの縦の縮み（割合）。試遊で決め直す。
 * @property {number} dentWiden へこみの量 1 のときの横の広がり（割合）。試遊で決め直す。
 */

/**
 * 攻防の演出の設定（凍結）。値は試遊で決め直す。
 * @type {Readonly<BattleAnimConfig>}
 */
export const BATTLE_ANIM = Object.freeze({
  formMs: 500,
  marchMs: 700,
  clashMs: 400,
  hitMoveMs: 350,
  hpMs: 300,
  fadeMs: 250,
  stepGapMs: 150,
  endDelayMs: 500,
  burnFlashMs: 400,
  burnFlyMs: 250,
  burnBlinks: 2,
  moveStyle: 'hop',
  hopHeight: 6,
  hopPeriodMs: 200,
  swayAngle: 0.2,
  swayPeriodMs: 300,
  moveStaggerMs: 12,
  moveStaggerMaxMs: 300,
  moveJitterMs: 300,
  speedSpread: 0.15,
  popHeight: 16,
  popMs: 150,
  fallAccel: 0.003,
  knockDistance: 50,
  fallStaggerMs: 15,
  fallStaggerMaxMs: 250,
  healMoveMs: 600,
  returnMs: 450,
  landMs: 400,
  landStaggerMs: 10,
  landStaggerMaxMs: 300,
  landJitterMs: 300,
  autoTroopAppearMs: 300,
  enterMs: 600,
  strikeStaggerMs: 90,
  strikeStaggerMaxMs: 1200,
  hitStaggerMs: 80,
  hitStaggerMaxMs: 1000,
  hitMarkMs: 250,
  hitMarkSize: 40,
  burnFireRatio: 0.6,
  hitStopMs: 30,
  hitStopCapMs: 150,
  heavyStopMs: 90,
  heavyStopCapMs: 450,
  flashMs: 120,
  flashSize: 30,
  damagePopMs: 600,
  damagePopRise: 28,
  damagePopSize: 22,
  sparkCount: 4,
  repairSparkCount: 3,
  sparkMs: 350,
  sparkSpeed: 0.15,
  sparkGravity: 0.0006,
  sparkSize: 4,
  sparkMax: 160,
  shakeAmp: 7,
  shakeMs: 260,
  shakePeriodMs: 45,
  breathDepth: 0.05,
  breathPeriodMs: 1600,
  figureBreathDepth: 0.025,
  figureBreathPeriodMs: 2000,
  rushPower: 2.2,
  chargeMs: 900,
  chargeLean: 0.12,
  chargeSwell: 0.08,
  chargeDim: 0.35,
  fireFlashMs: 220,
  fireFlashAlpha: 0.6,
  dentInMs: 60,
  dentOutMs: 220,
  dentSquash: 0.18,
  dentWiden: 0.08,
});

/**
 * 敵の動きの速さと止めの長さ1つぶん（敵の側の兵の動きの長さとヒットストップの長さに掛ける倍率）。
 * @typedef {Object} EnemyPace
 * @property {number} moveScale 敵の側の兵が出る・進む・城に当たるまで進む動きの長さの倍率（1 で今と同じ。大きいほど遅い）
 * @property {number} stopScale ヒットストップの1回の長さと段の合計の上限の倍率（1 で今と同じ）
 */

/**
 * 動きの速さの表（名前 → 倍率。凍結）。`ENEMY_SHOWS` の `pace` がこの名前を指す。値は試遊で決め直す。
 * @type {Readonly<Record<'normal'|'slow', Readonly<EnemyPace>>>}
 */
export const ENEMY_PACES = Object.freeze({
  normal: Object.freeze({ moveScale: 1, stopScale: 1 }),
  slow: Object.freeze({ moveScale: 1.5, stopScale: 2 }),
});

/**
 * 絵の敵の駆け寄りの見せ方1つぶん。時間の単位はミリ秒。
 * @typedef {Object} DashStyle
 * @property {number} goMs 最初の行き（絵が元の位置から行き先まで動く）の時間（ms）
 * @property {number} backMs 戻り（絵が元の位置へ戻る）の時間（ms）
 * @property {number} advanceMs 2本目の行き（防御の兵の前から城の前まで詰める）の時間（ms）
 * @property {number} hops 最初の行きの跳ねの回数（0 なら跳ねない）
 * @property {number} backHops 戻りの跳ねの回数
 * @property {number} advanceHops 2本目の行きの跳ねの回数
 * @property {number} hopHeight 跳ねの高さ（px）
 * @property {number} power 行きの進み具合の累乗（1 で等速。大きいほど終わりに加速する。戻りは easeInOutQuad）
 */

/**
 * 駆け寄りの見せ方の表（見せ方の名前 → 値。凍結）。`BATTLE_ANIM` とは別の表。
 * @type {Readonly<Record<'swift'|'straight'|'bounce', Readonly<DashStyle>>>}
 */
export const DASH_STYLES = Object.freeze({
  swift: Object.freeze({ goMs: 280, backMs: 420, advanceMs: 160, hops: 2, backHops: 2, advanceHops: 1, hopHeight: 14, power: 1.6 }),
  straight: Object.freeze({ goMs: 450, backMs: 650, advanceMs: 220, hops: 0, backHops: 0, advanceHops: 0, hopHeight: 0, power: 2.4 }),
  bounce: Object.freeze({ goMs: 750, backMs: 750, advanceMs: 300, hops: 3, backHops: 3, advanceHops: 1, hopHeight: 45, power: 1 }),
});
