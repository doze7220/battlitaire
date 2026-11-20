/**
 * OZ Vector Editor 形式のスプライト（ESモジュール）。他のファイルに依存しない。
 * 既定のexportは、スプライトデータと draw(ctx) を持つ1つのオブジェクト（単位px、基準点は原点、y軸は下向き）。
 * カードの裏の仮のスプライト（原点がカードの中心、幅100×高さ140）で、OZ Vector Editor で調整して差し替える。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 2,
  "bounds": {
    "minX": -51,
    "minY": -71,
    "maxX": 51,
    "maxY": 71
  },
  "elements": [
    {
      "kind": "polyline",
      "id": "shape-1",
      "points": [
        {
          "x": 42,
          "y": -70
        },
        {
          "x": 44.071,
          "y": -69.727
        },
        {
          "x": 46,
          "y": -68.928
        },
        {
          "x": 47.657,
          "y": -67.657
        },
        {
          "x": 48.928,
          "y": -66
        },
        {
          "x": 49.727,
          "y": -64.071
        },
        {
          "x": 50,
          "y": -62
        },
        {
          "x": 50,
          "y": 62
        },
        {
          "x": 49.727,
          "y": 64.071
        },
        {
          "x": 48.928,
          "y": 66
        },
        {
          "x": 47.657,
          "y": 67.657
        },
        {
          "x": 46,
          "y": 68.928
        },
        {
          "x": 44.071,
          "y": 69.727
        },
        {
          "x": 42,
          "y": 70
        },
        {
          "x": -42,
          "y": 70
        },
        {
          "x": -44.071,
          "y": 69.727
        },
        {
          "x": -46,
          "y": 68.928
        },
        {
          "x": -47.657,
          "y": 67.657
        },
        {
          "x": -48.928,
          "y": 66
        },
        {
          "x": -49.727,
          "y": 64.071
        },
        {
          "x": -50,
          "y": 62
        },
        {
          "x": -50,
          "y": -62
        },
        {
          "x": -49.727,
          "y": -64.071
        },
        {
          "x": -48.928,
          "y": -66
        },
        {
          "x": -47.657,
          "y": -67.657
        },
        {
          "x": -46,
          "y": -68.928
        },
        {
          "x": -44.071,
          "y": -69.727
        },
        {
          "x": -42,
          "y": -70
        }
      ],
      "closed": true,
      "strokeColor": "#333333",
      "strokeWidth": 2,
      "fillColor": "#2f4a8a"
    },
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": 40,
          "y": -64
        },
        {
          "x": 41.035,
          "y": -63.864
        },
        {
          "x": 42,
          "y": -63.464
        },
        {
          "x": 42.828,
          "y": -62.828
        },
        {
          "x": 43.464,
          "y": -62
        },
        {
          "x": 43.864,
          "y": -61.035
        },
        {
          "x": 44,
          "y": -60
        },
        {
          "x": 44,
          "y": 60
        },
        {
          "x": 43.864,
          "y": 61.035
        },
        {
          "x": 43.464,
          "y": 62
        },
        {
          "x": 42.828,
          "y": 62.828
        },
        {
          "x": 42,
          "y": 63.464
        },
        {
          "x": 41.035,
          "y": 63.864
        },
        {
          "x": 40,
          "y": 64
        },
        {
          "x": -40,
          "y": 64
        },
        {
          "x": -41.035,
          "y": 63.864
        },
        {
          "x": -42,
          "y": 63.464
        },
        {
          "x": -42.828,
          "y": 62.828
        },
        {
          "x": -43.464,
          "y": 62
        },
        {
          "x": -43.864,
          "y": 61.035
        },
        {
          "x": -44,
          "y": 60
        },
        {
          "x": -44,
          "y": -60
        },
        {
          "x": -43.864,
          "y": -61.035
        },
        {
          "x": -43.464,
          "y": -62
        },
        {
          "x": -42.828,
          "y": -62.828
        },
        {
          "x": -42,
          "y": -63.464
        },
        {
          "x": -41.035,
          "y": -63.864
        },
        {
          "x": -40,
          "y": -64
        }
      ],
      "closed": true,
      "strokeColor": "#9fb4e6",
      "strokeWidth": 2,
      "fillColor": null
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 2,
    "shapes": [
      {
        "type": "path",
        "id": "shape-1",
        "points": [
          {
            "x": 42,
            "y": -70
          },
          {
            "x": 44.071,
            "y": -69.727
          },
          {
            "x": 46,
            "y": -68.928
          },
          {
            "x": 47.657,
            "y": -67.657
          },
          {
            "x": 48.928,
            "y": -66
          },
          {
            "x": 49.727,
            "y": -64.071
          },
          {
            "x": 50,
            "y": -62
          },
          {
            "x": 50,
            "y": 62
          },
          {
            "x": 49.727,
            "y": 64.071
          },
          {
            "x": 48.928,
            "y": 66
          },
          {
            "x": 47.657,
            "y": 67.657
          },
          {
            "x": 46,
            "y": 68.928
          },
          {
            "x": 44.071,
            "y": 69.727
          },
          {
            "x": 42,
            "y": 70
          },
          {
            "x": -42,
            "y": 70
          },
          {
            "x": -44.071,
            "y": 69.727
          },
          {
            "x": -46,
            "y": 68.928
          },
          {
            "x": -47.657,
            "y": 67.657
          },
          {
            "x": -48.928,
            "y": 66
          },
          {
            "x": -49.727,
            "y": 64.071
          },
          {
            "x": -50,
            "y": 62
          },
          {
            "x": -50,
            "y": -62
          },
          {
            "x": -49.727,
            "y": -64.071
          },
          {
            "x": -48.928,
            "y": -66
          },
          {
            "x": -47.657,
            "y": -67.657
          },
          {
            "x": -46,
            "y": -68.928
          },
          {
            "x": -44.071,
            "y": -69.727
          },
          {
            "x": -42,
            "y": -70
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#333333",
        "strokeWidth": 2,
        "fillColor": "#2f4a8a"
      },
      {
        "type": "path",
        "id": "shape-2",
        "points": [
          {
            "x": 40,
            "y": -64
          },
          {
            "x": 41.035,
            "y": -63.864
          },
          {
            "x": 42,
            "y": -63.464
          },
          {
            "x": 42.828,
            "y": -62.828
          },
          {
            "x": 43.464,
            "y": -62
          },
          {
            "x": 43.864,
            "y": -61.035
          },
          {
            "x": 44,
            "y": -60
          },
          {
            "x": 44,
            "y": 60
          },
          {
            "x": 43.864,
            "y": 61.035
          },
          {
            "x": 43.464,
            "y": 62
          },
          {
            "x": 42.828,
            "y": 62.828
          },
          {
            "x": 42,
            "y": 63.464
          },
          {
            "x": 41.035,
            "y": 63.864
          },
          {
            "x": 40,
            "y": 64
          },
          {
            "x": -40,
            "y": 64
          },
          {
            "x": -41.035,
            "y": 63.864
          },
          {
            "x": -42,
            "y": 63.464
          },
          {
            "x": -42.828,
            "y": 62.828
          },
          {
            "x": -43.464,
            "y": 62
          },
          {
            "x": -43.864,
            "y": 61.035
          },
          {
            "x": -44,
            "y": 60
          },
          {
            "x": -44,
            "y": -60
          },
          {
            "x": -43.864,
            "y": -61.035
          },
          {
            "x": -43.464,
            "y": -62
          },
          {
            "x": -42.828,
            "y": -62.828
          },
          {
            "x": -42,
            "y": -63.464
          },
          {
            "x": -41.035,
            "y": -63.864
          },
          {
            "x": -40,
            "y": -64
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#9fb4e6",
        "strokeWidth": 2,
        "fillColor": null
      }
    ]
  }
};

const DEFAULT_STROKE_WIDTH = 2;

/**
 * スプライトを ctx へ描く。ctx の現在の変換の上に、原点(0, 0)を基準に描く。呼び出し前後で ctx の状態は変わらない。
 * @param {CanvasRenderingContext2D} ctx - 描画先の2Dコンテキスト
 */
function draw(ctx) {
    ctx.save();
    try {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 10;
        ctx.setLineDash([]);
        for (const element of spriteData.elements) {
            drawElement(ctx, element);
        }
    } finally {
        ctx.restore();
    }
}

/**
 * 描画要素1つの塗りと線を描く（パス → 塗り → 線の順）。
 * 塗るのは、fillColor が文字列で、かつ kind が polyline または ellipse で closed が true の要素だけ（fill() は引数なし）。
 * 線を描くのは strokeColor が文字列の要素だけ。どちらも描かない要素はパスも組み立てない。
 * 形の項目が足りない要素・未知の kind の要素は塗りも線も描かない。
 * @param {CanvasRenderingContext2D} ctx - 描画先の2Dコンテキスト
 * @param {Object} element - 描画要素
 */
function drawElement(ctx, element) {
    const shouldStroke = typeof element.strokeColor === 'string';
    const shouldFill = typeof element.fillColor === 'string' && element.closed === true
        && (element.kind === 'polyline' || element.kind === 'ellipse');
    if (!shouldStroke && !shouldFill) {
        return;
    }
    switch (element.kind) {
        case 'polyline': {
            const points = element.points;
            if (!Array.isArray(points) || points.length < 2) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            if (element.closed === true) {
                ctx.closePath();
            }
            break;
        }
        case 'quadratic': {
            const points = element.points;
            if (!Array.isArray(points) || points.length < 3) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
            break;
        }
        case 'ellipse': {
            if (typeof element.radiusX !== 'number' || !(element.radiusX >= 0)
                || typeof element.radiusY !== 'number' || !(element.radiusY >= 0)) {
                return;
            }
            ctx.beginPath();
            ctx.ellipse(element.x, element.y, element.radiusX, element.radiusY, 0, element.startAngle, element.endAngle);
            if (element.closed === true) {
                ctx.closePath();
            }
            break;
        }
        default:
            return;
    }
    if (shouldFill) {
        ctx.fillStyle = element.fillColor;
        ctx.fill();
    }
    if (shouldStroke) {
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = typeof element.strokeWidth === 'number' && Number.isFinite(element.strokeWidth) && element.strokeWidth > 0
            ? element.strokeWidth
            : DEFAULT_STROKE_WIDTH;
        ctx.stroke();
    }
}

export default { ...spriteData, draw };
