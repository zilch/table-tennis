import type { StartBotParams } from "zilch-game-engine";
import { Move } from "./play";

Zilch.Bot = class Bot {
  params: StartBotParams;

  lastPaddleY: number = 0;
  lastBallX: number = 0;
  lastBallY: number = 0;
  ballHitCount: number = 0;
  lastBallComingTowardPaddle = false;
  moveTowardNet = false;

  constructor(params: StartBotParams) {
    this.params = params;
  }

  static start(params: StartBotParams) {
    return new Bot(params);
  }

  move(payload: string) {
    const state = parsePayload(payload);
    const isP1 = this.params.botIndex === 0;

    const ballVelocity = {
      x: state.ball.x - this.lastBallX,
      y: state.ball.y - this.lastBallY,
    };

    const ballComingTowardsPaddle = isP1
      ? ballVelocity.x < 0
      : ballVelocity.x > 0;

    if (!ballComingTowardsPaddle && this.lastBallComingTowardPaddle) {
      this.ballHitCount++;
    }

    let move = "none";

    if (
      (this.params.type === "practice" && this.ballHitCount > 0) ||
      (this.params.type === "boss-easy" && this.ballHitCount > 2) ||
      (this.params.type === "boss-medium" && this.ballHitCount > 14)
    ) {
      if (this.params.type === "practice" && Math.random() < 0.5) {
        const moves = ["north", "south", "east", "west", "none"];
        move = moves[Math.floor(Math.random() * moves.length)];
      } else if (ballComingTowardsPaddle) {
        if (Math.abs(state.ball.y - state.paddle.y) < 1) {
          move = "none";
        } else if (state.ball.y < state.paddle.y) {
          move = "south";
        } else if (state.ball.y > state.paddle.y) {
          move = "north";
        } else {
          move = "none";
        }
      } else {
        move = "none";
      }
    } else if (ballComingTowardsPaddle) {
      const m = ballVelocity.x === 0 ? 0 : -ballVelocity.y / ballVelocity.x;
      const b = state.ball.x * m + state.ball.y;
      const yIntercept = -m * state.paddle.x + b;

      this.moveTowardNet = Math.random() > 0.5;

      if (Math.abs(yIntercept - state.paddle.y) < 1.5) {
        move = "none";
      } else if (yIntercept < state.paddle.y) {
        move = "south";
      } else if (yIntercept > state.paddle.y) {
        move = "north";
      } else {
        move = "none";
      }
    } else {
      if (state.paddle.y > 1) {
        move = "south";
      } else if (state.paddle.y < -1) {
        move = "north";
      } else if (
        this.params.type !== "boss-easy" &&
        !this.moveTowardNet &&
        Math.abs(state.paddle.x) < 38
      ) {
        move = isP1 ? "east" : "west";
      } else if (
        this.params.type !== "boss-easy" &&
        this.moveTowardNet &&
        Math.abs(state.paddle.x) > 20
      ) {
        move = isP1 ? "west" : "east";
      } else {
        move = "none";
      }
    }

    this.lastBallComingTowardPaddle = ballComingTowardsPaddle;
    this.lastBallX = state.ball.x;
    this.lastBallY = state.ball.y;
    this.lastPaddleY = state.paddle.y;

    return move;
  }

  end(payload: string) {}
};

function parsePayload(payload: string) {
  const parts = payload.split(",");

  if (parts.length !== 4) {
    throw new Error("Unexpected payload");
  }

  const [paddleX, paddleY, ballX, ballY] = parts.map((value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      throw new Error("Unexpected payload");
    }

    return num;
  });

  return {
    paddle: {
      x: paddleX,
      y: paddleY,
    },
    ball: {
      x: ballX,
      y: ballY,
    },
  };
}
