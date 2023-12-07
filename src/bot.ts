import type { StartBotParams } from "zilch-game-engine";
import { Move } from "./play";

Zilch.Bot = class Bot {
  params: StartBotParams;

  lastPaddleY: number = 0;
  lastBallX: number = 0;
  lastBallY: number = 0;
  lastBallComingTowardPaddle = false;
  hasHitBall = false;
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
    const player = isP1 ? state.p1 : state.p2;

    const ballVelocity = {
      x: state.ball.x - this.lastBallX,
      y: state.ball.y - this.lastBallY,
    };

    const ballComingTowardsPaddle = isP1
      ? ballVelocity.x < 0
      : ballVelocity.x > 0;

    if (!ballComingTowardsPaddle && this.lastBallComingTowardPaddle) {
      this.hasHitBall = true;
    }

    let move = "none";

    if (this.params.type === "practice") {
      if (Math.random() < 0.5 && this.hasHitBall) {
        const moves = ["south", "north", "east", "west"];
        move = moves[Math.floor(Math.random() * moves.length)];
      } else if (Math.abs(state.ball.y - player.y) < 2) {
        move = "none";
      } else if (state.ball.y < player.y) {
        move = "south";
      } else {
        move = "north";
      }
    } else if (this.params.type === "boss-easy") {
      if (Math.abs(state.ball.y - player.y) < 2) {
        move = "none";
      } else if (state.ball.y < player.y) {
        move = "south";
      } else {
        move = "north";
      }
    } else if (this.params.type === "boss-medium") {
      if (ballComingTowardsPaddle) {
        if (Math.abs(player.y - state.ball.y) < 1) {
          if (isP1 ? player.x < -5 : player.x > 5) {
            move = isP1 ? "west" : "east";
          } else {
            move = "none";
          }
        } else if (player.y > state.ball.y) {
          move = "south";
        } else {
          move = "north";
        }
      } else {
        if (Math.abs(player.y) > 2) {
          move = player.y > 0 ? "south" : "north";
        } else if (Math.abs(player.x) < 40) {
          move = isP1 ? "east" : "west";
        } else {
          move = "none";
        }
      }
    } else if (this.params.type == "boss-hard") {
      if (ballComingTowardsPaddle) {
        const m = ballVelocity.x === 0 ? 0 : -ballVelocity.y / ballVelocity.x;
        const b = state.ball.x * m + state.ball.y;
        const yIntercept = -m * player.x + b;

        this.moveTowardNet = Math.random() > 0.4;

        if (Math.abs(yIntercept - player.y) < 1) {
          move = "none";
        } else if (yIntercept < player.y) {
          move = "south";
        } else if (yIntercept > player.y) {
          move = "north";
        } else {
          move = "none";
        }
      } else {
        if (player.y > 1) {
          move = "south";
        } else if (player.y < -1) {
          move = "north";
        } else if (!this.moveTowardNet && Math.abs(player.x) < 38) {
          move = isP1 ? "east" : "west";
        } else if (this.moveTowardNet && Math.abs(player.x) > 20) {
          move = isP1 ? "west" : "east";
        } else {
          move = "none";
        }
      }
    }

    this.lastBallComingTowardPaddle = ballComingTowardsPaddle;
    this.lastBallX = state.ball.x;
    this.lastBallY = state.ball.y;
    this.lastPaddleY = player.y;

    return move;
  }

  end(payload: string) {}
};

function parsePayload(payload: string) {
  const parts = payload.split(",");

  if (parts.length !== 6) {
    throw new Error("Unexpected payload");
  }

  const [p1x, p1y, p2x, p2y, ballX, ballY] = parts.map((value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      throw new Error("Unexpected payload");
    }

    return num;
  });

  return {
    p1: {
      x: p1x,
      y: p1y,
    },
    p2: {
      x: p2x,
      y: p2y,
    },
    ball: {
      x: ballX,
      y: ballY,
    },
  };
}
