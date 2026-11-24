/**
 * OZ Vector Editor が出力したスプライト（ESモジュール）。他のファイルに依存しない。
 * 既定のexportは、スプライトデータ（format・formatVersion・bounds・elements・source）と、
 * それを描く draw(ctx) を持つ1つのオブジェクト。座標の単位はpx、基準点は原点(0, 0)、y軸は下向き。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 4,
  "bounds": {
    "minX": -106,
    "minY": -105,
    "maxX": 166.00588206191617,
    "maxY": 105
  },
  "elements": [
    {
      "kind": "ellipse",
      "id": "shape-39",
      "x": 0,
      "y": 0,
      "radiusX": 98,
      "radiusY": 97,
      "rotation": 0,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 16,
      "fillColor": "#ffffff"
    },
    {
      "kind": "polyline",
      "id": "shape-134",
      "points": [
        {
          "x": 100.86245268873134,
          "y": -74.21049605128849
        },
        {
          "x": 158.00588206191617,
          "y": -26.21436621281262
        },
        {
          "x": 127.50598286040912,
          "y": 73.62428436249269
        },
        {
          "x": 78.99620456376519,
          "y": 89.33419873560277
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 16,
      "fillColor": "#697ace"
    },
    {
      "kind": "polyline",
      "id": "shape-135",
      "points": [
        {
          "x": 32.39107150624798,
          "y": -45.027111070051916
        },
        {
          "x": 35.458768514615684,
          "y": 60.30849181456091
        },
        {
          "x": 78.0050245953598,
          "y": 89.20167601969388
        },
        {
          "x": 100.99497540464023,
          "y": -75.20167601969388
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 16,
      "fillColor": "#4656a4"
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 3,
    "shapes": [
      {
        "type": "circle",
        "id": "shape-39",
        "points": [
          {
            "x": 0,
            "y": 0
          },
          {
            "x": 98,
            "y": 0
          },
          {
            "x": 0,
            "y": -97
          },
          {
            "x": 98,
            "y": 0
          },
          {
            "x": 98,
            "y": 0
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 16,
        "fillColor": "#ffffff"
      },
      {
        "type": "rect",
        "id": "shape-134",
        "points": [
          {
            "x": 100.86245268873134,
            "y": -74.21049605128849
          },
          {
            "x": 158.00588206191617,
            "y": -26.21436621281262
          },
          {
            "x": 127.50598286040912,
            "y": 73.62428436249269
          },
          {
            "x": 78.99620456376519,
            "y": 89.33419873560277
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 16,
        "fillColor": "#697ace"
      },
      {
        "type": "rect",
        "id": "shape-135",
        "points": [
          {
            "x": 32.39107150624798,
            "y": -45.027111070051916
          },
          {
            "x": 35.458768514615684,
            "y": 60.30849181456091
          },
          {
            "x": 78.0050245953598,
            "y": 89.20167601969388
          },
          {
            "x": 100.99497540464023,
            "y": -75.20167601969388
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 16,
        "fillColor": "#4656a4"
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
 * 塗るのは、fillColor が文字列で、かつ kind が polyline・ellipse・bezierPath のいずれかで closed が true の要素だけ（fill() は引数なし）。
 * 線を描くのは strokeColor が文字列の要素だけ。どちらも描かない要素はパスも組み立てない。
 * 形の項目が足りない要素・未知の kind の要素は塗りも線も描かない。
 * ellipse の rotation（ラジアン）が有限の数値でなければ0として描く（rotation の無い版3以前の要素も描ける）。
 * @param {CanvasRenderingContext2D} ctx - 描画先の2Dコンテキスト
 * @param {Object} element - 描画要素
 */
function drawElement(ctx, element) {
    const shouldStroke = typeof element.strokeColor === 'string';
    const shouldFill = typeof element.fillColor === 'string' && element.closed === true
        && (element.kind === 'polyline' || element.kind === 'ellipse' || element.kind === 'bezierPath');
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
        case 'bezierPath': {
            const points = element.points;
            const segments = element.segments;
            if (!Array.isArray(points) || points.length < 2 || !Array.isArray(segments)
                || segments.length !== (element.closed === true ? points.length : points.length - 1)) {
                return;
            }
            for (const segment of segments) {
                if (typeof segment !== 'object' || segment === null) {
                    return;
                }
                if (segment.kind === 'cubic') {
                    if (typeof segment.control1 !== 'object' || segment.control1 === null
                        || typeof segment.control2 !== 'object' || segment.control2 === null) {
                        return;
                    }
                } else if (segment.kind !== 'line') {
                    return;
                }
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < segments.length; i++) {
                const end = points[(i + 1) % points.length];
                if (segments[i].kind === 'cubic') {
                    ctx.bezierCurveTo(segments[i].control1.x, segments[i].control1.y, segments[i].control2.x, segments[i].control2.y, end.x, end.y);
                } else if (!(element.closed === true && i === points.length - 1)) {
                    ctx.lineTo(end.x, end.y);
                }
            }
            if (element.closed === true) {
                ctx.closePath();
            }
            break;
        }
        case 'ellipse': {
            if (typeof element.radiusX !== 'number' || !(element.radiusX >= 0)
                || typeof element.radiusY !== 'number' || !(element.radiusY >= 0)) {
                return;
            }
            ctx.beginPath();
            ctx.ellipse(element.x, element.y, element.radiusX, element.radiusY, Number.isFinite(element.rotation) ? element.rotation : 0, element.startAngle, element.endAngle);
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
