import { Hit, State } from "../config";

interface Point {
  x: number;
  y: number;
}

interface MovingPoint extends Point {
  xVelocity: number;
  yVelocity: number;
}

interface MovingCircle extends Point {
  radius: number;
  xVelocity: number;
  yVelocity: number;
}

interface MovingLine {
  xVelocity: number;
  yVelocity: number;
  p1: Point;
  p2: Point;
}

interface Intercept {
  time: number;
  point: Point;
  edge: boolean;
}

export const zMultiplier = 5;

function getY(a: number, x: number, hitPoint: Point, landX: number) {
  let x1 = hitPoint.x;
  let y1 = hitPoint.y;
  let x2 = landX;
  let y2 = 0;

  if (landX > hitPoint.x) {
    x1 = hitPoint.x;
    y1 = hitPoint.y;
    x2 = hitPoint.x - (landX - hitPoint.x);
    y2 = 0;
    x = hitPoint.x - (x - hitPoint.x);
  }

  const b = (y2 - y1) / (x2 - x1) - a * (x1 + x2);
  const c = y1 - (x1 * (y2 - y1)) / (x2 - x1) + a * x1 * x2;
  const width = 2 * (-b / (2 * a) - x2);
  const xBounded = (Math.abs(x - x2) % width) + x2;
  const y = a * xBounded ** 2 + b * xBounded + c;

  return y;
}

export function getBallZ(ballX: number, { hitX, hitZ, landX }: Hit) {
  let aDenominator = 20;

  for (; aDenominator > 0; aDenominator -= 5) {
    if (
      4 <
      getY(-1 / aDenominator, 0, { x: hitX, y: hitZ }, landX) / zMultiplier
    ) {
      break;
    }
  }

  const z =
    getY(
      -1 / Math.max(1, aDenominator - 0.6),
      ballX,
      { x: hitX, y: hitZ },
      landX
    ) / zMultiplier;

  if (Number.isNaN(z)) {
    return 0;
  } else {
    return z;
  }
}

export function getCircleLineIntercept(
  circle: MovingCircle,
  line: MovingLine
): Intercept | null {
  const getEdgeIntercept = () => {
    const edge1Intercept = getCirclePointIntercept(circle, {
      x: line.p1.x,
      y: line.p1.y,
      xVelocity: line.xVelocity,
      yVelocity: line.yVelocity,
    });
    const edge2Intercept = getCirclePointIntercept(circle, {
      x: line.p2.x,
      y: line.p2.y,
      xVelocity: line.xVelocity,
      yVelocity: line.yVelocity,
    });

    if (!edge1Intercept || !edge2Intercept) {
      return edge1Intercept ?? edge2Intercept ?? null;
    }

    if (edge1Intercept.time < edge2Intercept.time) {
      return edge1Intercept;
    } else {
      return edge2Intercept;
    }
  };

  const a = line.p2.x;
  const b = line.xVelocity;
  const c = line.p1.x;
  const d = line.p1.y;
  const e = line.yVelocity;
  const f = circle.y;
  const g = circle.yVelocity;
  const h = circle.x;
  const i = circle.xVelocity;
  const j = line.p2.y;
  const k = circle.radius;

  // Solve for t
  // k=abs((a+t*b-(c+t*b))*(d+t*e-(f+t*g))-(c+t*b-(h+t*i))*(j+t*e-(d+t*e)))/sqrt((a+t*b-(c+t*b))**2+(j+t*e-(d+t*e))**2)

  // prettier-ignore
  const time=(-2*d*e*a**2+2*e*f*a**2+2*d*g*a**2-2*f*g*a**2-2*b*d**2*a+2*c*d*e*a+2*b*d*f*a-4*c*e*f*a-2*c*d*g*a+4*c*f*g*a+2*d*e*h*a-2*d*g*h*a+2*d**2*i*a-2*d*f*i*a+2*b*d*j*a+2*c*e*j*a-2*b*f*j*a-2*c*g*j*a-2*e*h*j*a+2*g*h*j*a-2*d*i*j*a+2*f*i*j*a-2*b*c*j**2+2*b*h*j**2+2*c*i*j**2-2*h*i*j**2-2*b*c*d*f+2*c**2*e*f-2*c**2*f*g+2*b*d**2*h-2*c*d*e*h+2*c*d*g*h+2*c*d*f*i-2*d**2*h*i+2*b*c*d*j-2*c**2*e*j+2*b*c*f*j+2*c**2*g*j-4*b*d*h*j+2*c*e*h*j-2*c*g*h*j-2*c*d*i*j-2*c*f*i*j+4*d*h*i*j-Math.sqrt((2*d*e*a**2-2*e*f*a**2-2*d*g*a**2+2*f*g*a**2+2*b*d**2*a-2*c*d*e*a-2*b*d*f*a+4*c*e*f*a+2*c*d*g*a-4*c*f*g*a-2*d*e*h*a+2*d*g*h*a-2*d**2*i*a+2*d*f*i*a-2*b*d*j*a-2*c*e*j*a+2*b*f*j*a+2*c*g*j*a+2*e*h*j*a-2*g*h*j*a+2*d*i*j*a-2*f*i*j*a+2*b*c*j**2-2*b*h*j**2-2*c*i*j**2+2*h*i*j**2+2*b*c*d*f-2*c**2*e*f+2*c**2*f*g-2*b*d**2*h+2*c*d*e*h-2*c*d*g*h-2*c*d*f*i+2*d**2*h*i-2*b*c*d*j+2*c**2*e*j-2*b*c*f*j-2*c**2*g*j+4*b*d*h*j-2*c*e*h*j+2*c*g*h*j+2*c*d*i*j+2*c*f*i*j-4*d*h*i*j)**2-4*(e**2*a**2+g**2*a**2-2*e*g*a**2-2*c*e**2*a-2*c*g**2*a+2*b*d*e*a-2*b*d*g*a+4*c*e*g*a-2*d*e*i*a+2*d*g*i*a-2*b*e*j*a+2*b*g*j*a+2*e*i*j*a-2*g*i*j*a+b**2*d**2+c**2*e**2+c**2*g**2+d**2*i**2+b**2*j**2+i**2*j**2-2*b*i*j**2-2*b*c*d*e+2*b*c*d*g-2*c**2*e*g-2*b*d**2*i+2*c*d*e*i-2*c*d*g*i-2*d*i**2*j-2*b**2*d*j+2*b*c*e*j-2*b*c*g*j+4*b*d*i*j-2*c*e*i*j+2*c*g*i*j)*(d**2*a**2+f**2*a**2-k**2*a**2-2*d*f*a**2-2*c*f**2*a+2*c*k**2*a+2*c*d*f*a-2*d**2*h*a+2*d*f*h*a-2*c*d*j*a+2*c*f*j*a+2*d*h*j*a-2*f*h*j*a+c**2*f**2+d**2*h**2+c**2*j**2+h**2*j**2-2*c*h*j**2-c**2*k**2-d**2*k**2-j**2*k**2+2*d*j*k**2-2*c*d*f*h-2*d*h**2*j-2*c**2*f*j+2*c*d*h*j+2*c*f*h*j)))/(2*(e**2*a**2+g**2*a**2-2*e*g*a**2-2*c*e**2*a-2*c*g**2*a+2*b*d*e*a-2*b*d*g*a+4*c*e*g*a-2*d*e*i*a+2*d*g*i*a-2*b*e*j*a+2*b*g*j*a+2*e*i*j*a-2*g*i*j*a+b**2*d**2+c**2*e**2+c**2*g**2+d**2*i**2+b**2*j**2+i**2*j**2-2*b*i*j**2-2*b*c*d*e+2*b*c*d*g-2*c**2*e*g-2*b*d**2*i+2*c*d*e*i-2*c*d*g*i-2*d*i**2*j-2*b**2*d*j+2*b*c*e*j-2*b*c*g*j+4*b*d*i*j-2*c*e*i*j+2*c*g*i*j));

  if (Number.isNaN(time) || !Number.isFinite(time) || time > 1 || time < 0) {
    return getEdgeIntercept();
  }

  const lineInterceptP1: Point = {
    x: line.p1.x + line.xVelocity * time,
    y: line.p1.y + line.yVelocity * time,
  };

  const lineInterceptP2: Point = {
    x: line.p2.x + line.xVelocity * time,
    y: line.p2.y + line.yVelocity * time,
  };

  const angle =
    Math.atan2(
      lineInterceptP2.y - lineInterceptP1.y,
      lineInterceptP2.x - lineInterceptP1.x
    ) +
    Math.PI / 2;

  const point: Point = {
    x: circle.x + circle.xVelocity * time + Math.cos(angle) * circle.radius,
    y: circle.y + circle.yVelocity * time + Math.sin(angle) * circle.radius,
  };

  const lineMidPoint: Point = {
    x: (lineInterceptP2.x - lineInterceptP1.x) / 2 + lineInterceptP1.x,
    y: (lineInterceptP2.y - lineInterceptP1.y) / 2 + lineInterceptP1.y,
  };

  if (dist(point, lineMidPoint) > dist(lineInterceptP1, lineInterceptP2) / 2) {
    return getEdgeIntercept();
  }

  return { time, point, edge: false };
}

function getCirclePointIntercept(
  circle: MovingCircle,
  point: MovingPoint
): Intercept | null {
  const a = circle.radius;
  const b = circle.x;
  const c = circle.xVelocity;
  const d = point.x;
  const e = point.xVelocity;
  const f = circle.y;
  const g = circle.yVelocity;
  const h = point.y;
  const j = point.yVelocity;

  // Solve for t
  // circle.radius = Math.sqrt(
  //   ((circle.x + circle.xVelocity * t) - (point.x + point.xVelocity * t)) ** 2 +
  //   ((circle.y + circle.yVelocity * t) - (point.y + point.yVelocity * t)) ** 2
  // )

  // prettier-ignore
  const time = (-Math.sqrt((2*b*c-2*b*e-2*c*d+2*d*e+2*f*g-2*f*j-2*g*h+2*h*j)**2-4*(c**2-2*c*e+e**2+g**2-2*g*j+j**2)*(-(a**2)+b**2-2*b*d+d**2+f**2-2*f*h+h**2))-2*b*c+2*b*e+2*c*d-2*d*e-2*f*g+2*f*j+2*g*h-2*h*j)/(2*(c**2-2*c*e+e**2+g**2-2*g*j+j**2));

  if (Number.isNaN(time) || !Number.isFinite(time) || time < 0 || time > 1) {
    return null;
  }

  return {
    edge: true,
    time,
    point: {
      x: point.x + point.xVelocity * time,
      y: point.y + point.yVelocity * time,
    },
  };
}

function dist(p1: Point, p2: Point) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}
