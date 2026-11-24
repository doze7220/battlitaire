/**
 * OZ Vector Editor が出力したスプライト（ESモジュール）。他のファイルに依存しない。
 * 既定のexportは、スプライトデータ（format・formatVersion・bounds・elements・source）と、
 * それを描く draw(ctx) を持つ1つのオブジェクト。座標の単位はpx、基準点は原点(0, 0)、y軸は下向き。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 4,
  "bounds": {
    "minX": -34.5,
    "minY": -35.5,
    "maxX": 35.5,
    "maxY": 35.5
  },
  "elements": [
    {
      "kind": "polyline",
      "id": "shape-1",
      "points": [
        {
          "x": 27,
          "y": -27
        },
        {
          "x": -18,
          "y": -27
        },
        {
          "x": -18,
          "y": 0
        },
        {
          "x": 18,
          "y": 0
        },
        {
          "x": 18,
          "y": 27
        },
        {
          "x": -26,
          "y": 27
        }
      ],
      "closed": false,
      "strokeColor": "#111827",
      "strokeWidth": 17,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": 24,
          "y": -27
        },
        {
          "x": -18,
          "y": -27
        },
        {
          "x": -18,
          "y": 0
        },
        {
          "x": 18,
          "y": 0
        },
        {
          "x": 18,
          "y": 27
        },
        {
          "x": -22,
          "y": 27
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 11,
      "fillColor": null
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 3,
    "shapes": [
      {
        "type": "path",
        "id": "shape-1",
        "points": [
          {
            "x": 27,
            "y": -27
          },
          {
            "x": -18,
            "y": -27
          },
          {
            "x": -18,
            "y": 0
          },
          {
            "x": 18,
            "y": 0
          },
          {
            "x": 18,
            "y": 27
          },
          {
            "x": -26,
            "y": 27
          }
        ],
        "closed": false,
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
          }
        ],
        "strokeColor": "#111827",
        "strokeWidth": 17,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-2",
        "points": [
          {
            "x": 24,
            "y": -27
          },
          {
            "x": -18,
            "y": -27
          },
          {
            "x": -18,
            "y": 0
          },
          {
            "x": 18,
            "y": 0
          },
          {
            "x": 18,
            "y": 27
          },
          {
            "x": -22,
            "y": 27
          }
        ],
        "closed": false,
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
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 11,
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
