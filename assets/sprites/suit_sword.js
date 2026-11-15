/**
 * OZ Vector Editor が出力したスプライト（ESモジュール）。他のファイルに依存しない。
 * 既定のexportは、スプライトデータ（format・formatVersion・bounds・elements・source）と、
 * それを描く draw(ctx) を持つ1つのオブジェクト。座標の単位はpx、基準点は原点(0, 0)、y軸は下向き。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 2,
  "bounds": {
    "minX": -39.5,
    "minY": -100.5,
    "maxX": 40.5,
    "maxY": 99.5
  },
  "elements": [
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": 0,
          "y": -100
        },
        {
          "x": 25,
          "y": -80
        },
        {
          "x": 20,
          "y": 40
        },
        {
          "x": 0,
          "y": 40
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 1,
      "fillColor": "#ffffff"
    },
    {
      "kind": "polyline",
      "id": "shape-3",
      "points": [
        {
          "x": -25,
          "y": -80
        },
        {
          "x": -19,
          "y": 40
        },
        {
          "x": 0,
          "y": 40
        },
        {
          "x": 0,
          "y": -100
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 1,
      "fillColor": "#dedede"
    },
    {
      "kind": "polyline",
      "id": "shape-4",
      "points": [
        {
          "x": -39,
          "y": 40
        },
        {
          "x": 40,
          "y": 40
        },
        {
          "x": 30,
          "y": 59
        },
        {
          "x": -29,
          "y": 59
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 1,
      "fillColor": "#ffdd00"
    },
    {
      "kind": "polyline",
      "id": "shape-5",
      "points": [
        {
          "x": -9,
          "y": 59
        },
        {
          "x": 10,
          "y": 59
        },
        {
          "x": 10,
          "y": 99
        },
        {
          "x": -9,
          "y": 99
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 1,
      "fillColor": "#ffdd00"
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 2,
    "shapes": [
      {
        "type": "rect",
        "id": "shape-2",
        "points": [
          {
            "x": 0,
            "y": -100
          },
          {
            "x": 25,
            "y": -80
          },
          {
            "x": 20,
            "y": 40
          },
          {
            "x": 0,
            "y": 40
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 1,
        "fillColor": "#ffffff"
      },
      {
        "type": "rect",
        "id": "shape-3",
        "points": [
          {
            "x": -25,
            "y": -80
          },
          {
            "x": -19,
            "y": 40
          },
          {
            "x": 0,
            "y": 40
          },
          {
            "x": 0,
            "y": -100
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 1,
        "fillColor": "#dedede"
      },
      {
        "type": "rect",
        "id": "shape-4",
        "points": [
          {
            "x": -39,
            "y": 40
          },
          {
            "x": 40,
            "y": 40
          },
          {
            "x": 30,
            "y": 59
          },
          {
            "x": -29,
            "y": 59
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 1,
        "fillColor": "#ffdd00"
      },
      {
        "type": "rect",
        "id": "shape-5",
        "points": [
          {
            "x": -9,
            "y": 59
          },
          {
            "x": 10,
            "y": 59
          },
          {
            "x": 10,
            "y": 99
          },
          {
            "x": -9,
            "y": 99
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 1,
        "fillColor": "#ffdd00"
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
