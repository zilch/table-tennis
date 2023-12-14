import { Bot, BotOutcome } from "zilch-game-engine";
import { Chalk } from "chalk";
import { Hit, Point, State } from "./config";
import { getBallZ, getCircleLineIntercept, zMultiplier } from "./ui/math";

const chalk = new Chalk({ level: 3 });

export type Move = "north" | "south" | "east" | "west" | "none";

Zilch.play = async function* (game) {
  const serveTo =
    game.config.serveTo === "random"
      ? Math.random() > 0.5
        ? "east"
        : "west"
      : game.config.serveTo;

  const initialHit: Hit = {
    hitX: -20,
    hitZ: 1.5,
    landX: 20,
  };

  let initialAngle = 0.3;

  if (serveTo === "east") {
    initialAngle += Math.PI;
    initialHit.hitX *= -1;
    initialHit.landX *= -1;
  }

  const state: State = {
    index: 0,
    annotations: [],
    lastBall: null,
    ball: {
      speed: 10,
      intercept: null,
      hit: initialHit,
      angle: initialAngle,
      position: {
        x: 0,
        y: 0,
      },
    },
    p1: {
      lastMove: "none",
      wins: 0,
      position: {
        x: -34,
        y: -10,
      },
    },
    p2: {
      lastMove: "none",
      wins: 0,
      position: {
        x: 34,
        y: 10,
      },
    },
  };

  const previousP1Moves: Move[] = [];
  const previousP2Moves: Move[] = [];

  while (true) {
    const payload = createMovePayload(state);

    state.index++;

    const logMove = (bot: Bot) => {
      return (move: Move | Error) => {
        if (!(move instanceof Error)) {
          bot.writeln(chalk.dim(`⤷ ${move}`));
        }

        return move;
      };
    };

    game.bots[0].writeln(chalk.dim(`Start move`));
    game.bots[1].writeln(chalk.dim(`Start move`));
    const [p1Move, p2Move] = await Promise.all([
      game.bots[0]
        .move(payload)
        .then(parseMoveResponse)
        .then(logMove(game.bots[0])),
      game.bots[1]
        .move(payload)
        .then(parseMoveResponse)
        .then(logMove(game.bots[1])),
    ]);

    if (p1Move instanceof Error) {
      game.bots[0].writeln(
        chalk.red(`Unable to parse move. ${p1Move.message}`)
      );
      yield { outcome: [BotOutcome.Error, BotOutcome.None], state };
      continue;
    }

    if (p2Move instanceof Error) {
      game.bots[1].writeln(
        chalk.red(`Unable to parse move. ${p2Move.message}`)
      );
      yield { outcome: [BotOutcome.None, BotOutcome.Error], state };
      continue;
    }

    state.annotations = [];
    const p1Velocity = getMoveVelocity(
      "p1",
      state.p1.position,
      p1Move,
      previousP1Moves
    );
    const p2Velocity = getMoveVelocity(
      "p2",
      state.p2.position,
      p2Move,
      previousP2Moves
    );
    moveBall(state, p1Velocity, p2Velocity);
    state.p1.position.x += p1Velocity.x;
    state.p1.position.y += p1Velocity.y;
    state.p2.position.x += p2Velocity.x;
    state.p2.position.y += p2Velocity.y;

    previousP1Moves.unshift(p1Move);
    previousP2Moves.unshift(p2Move);

    if (previousP1Moves.length > 4) {
      previousP1Moves.pop();
    }

    if (previousP2Moves.length > 4) {
      previousP2Moves.pop();
    }

    const passAmount = 8;

    if (
      Math.cos(state.ball.angle) > 0 &&
      state.ball.position.x > 36 &&
      state.ball.position.x > state.p2.position.x + passAmount
    ) {
      yield {
        state,
        outcome: [BotOutcome.Victory, BotOutcome.Defeat],
      };
    }

    if (
      Math.cos(state.ball.angle) < 0 &&
      state.ball.position.x < -36 &&
      state.ball.position.x < state.p1.position.x - passAmount
    ) {
      yield {
        state,
        outcome: [BotOutcome.Defeat, BotOutcome.Victory],
      };
    }

    yield { state, outcome: null };
  }
};

interface Velocity {
  x: number;
  y: number;
}

// TODO sometimes ball suddenly changes direction in the middle of the table - not sure why
// or how to reliably reproduce.
function moveBall(state: State, p1Velocity: Velocity, p2Velocity: Velocity) {
  if (
    handlePaddleHit(state, p1Velocity, "p1") ||
    handlePaddleHit(state, p2Velocity, "p2")
  ) {
    return;
  }

  const xVelocity = Math.cos(state.ball.angle) * state.ball.speed;
  const yVelocity = Math.sin(state.ball.angle) * state.ball.speed;
  state.ball.intercept = null;
  state.ball.position.x += xVelocity;
  state.ball.position.y += yVelocity;
}

function handlePaddleHit(
  state: State,
  paddleVelocity: Velocity,
  player: "p1" | "p2"
) {
  const xVelocity = Math.cos(state.ball.angle) * state.ball.speed;
  const yVelocity = Math.sin(state.ball.angle) * state.ball.speed;

  if (
    (player === "p1" && xVelocity > 0) ||
    (player === "p2" && xVelocity < 0)
  ) {
    return false;
  }

  const paddleLength = 5.5;

  const intercept = getCircleLineIntercept(
    {
      radius: 0.8,
      x: state.ball.position.x,
      y: state.ball.position.y,
      xVelocity: Math.cos(state.ball.angle) * state.ball.speed,
      yVelocity: Math.sin(state.ball.angle) * state.ball.speed,
    },
    {
      p1: {
        x: state[player].position.x,
        y: state[player].position.y - paddleLength / 2,
      },
      p2: {
        x: state[player].position.x,
        y: state[player].position.y + paddleLength / 2,
      },
      xVelocity: paddleVelocity.x,
      yVelocity: paddleVelocity.y,
    }
  );

  if (!intercept) {
    return false;
  }

  const forwardPaddleVelocity =
    (player === "p1" && paddleVelocity.x > 0) ||
    (player === "p2" && paddleVelocity.x < 0);
  const nearNet = Math.abs(state[player].position.x) < 24;
  let yHitWindow = 10;
  if (nearNet) {
    yHitWindow *= 1.4;
  }
  if (forwardPaddleVelocity) {
    yHitWindow *= 1.4;
  }

  const landPoint: Point = {
    x: (Math.random() * 11.8 + 11.8) * (player === "p1" ? 1 : -1),
    y: Math.random() * yHitWindow - yHitWindow / 2,
  };

  const ballX = state.ball.position.x + xVelocity * intercept.time;

  const ballZ = getBallZ(ballX, state.ball.hit) * zMultiplier;

  state.lastBall = JSON.parse(JSON.stringify(state.ball));

  state.ball.hit = {
    hitX: ballX,
    hitZ: ballZ,
    landX: landPoint.x,
  };

  state.ball.intercept = {
    x: ballX,
    y: state.ball.position.y + yVelocity * intercept.time,
  };

  if (
    (paddleVelocity.x < 0 && player === "p2") ||
    (paddleVelocity.x > 0 && player === "p1")
  ) {
    state.ball.speed *= 1.1;
  } else {
    state.ball.speed *= 1.02;
  }

  const remainingSpeed = state.ball.speed * (1 - intercept.time);
  state.ball.angle = Math.atan2(
    landPoint.y - state.ball.position.y,
    landPoint.x - state.ball.position.x
  );
  state.ball.position = {
    x: state.ball.position.x + Math.cos(state.ball.angle) * remainingSpeed,
    y: state.ball.position.y + Math.sin(state.ball.angle) * remainingSpeed,
  };

  return true;
}

function getMoveVelocity(
  player: "p1" | "p2",
  paddlePosition: Point,
  move: Move,
  previousMoves: Move[]
): Velocity {
  if (move === "none") {
    return { x: 0, y: 0 };
  }

  let identicalPreviousMoveCount = 0;
  for (let i = 0; i < Math.min(4, previousMoves.length); i++) {
    if (previousMoves[i] === move) {
      identicalPreviousMoveCount++;
    } else {
      break;
    }
  }

  const speed = 1.5 + 2 * identicalPreviousMoveCount;

  const velocity = {
    x:
      move === "north" || move === "south"
        ? 0
        : move === "east"
        ? -speed
        : speed,
    y:
      move === "east" || move === "west"
        ? 0
        : move === "north"
        ? speed
        : -speed,
  };

  const netLimit = 23.6;
  const backLimit = 42;

  if (player === "p1") {
    if (paddlePosition.x + velocity.x > -netLimit) {
      velocity.x = -netLimit - paddlePosition.x;
    } else if (paddlePosition.x + velocity.x < -backLimit) {
      velocity.x = -backLimit - paddlePosition.x;
    }
  } else {
    if (paddlePosition.x + velocity.x < netLimit) {
      velocity.x = netLimit - paddlePosition.x;
    } else if (paddlePosition.x + velocity.x > backLimit) {
      velocity.x = backLimit - paddlePosition.x;
    }
  }

  return velocity;
}

function parseMoveResponse(response: string): Move | Error {
  if (
    response === "north" ||
    response === "south" ||
    response === "east" ||
    response === "west" ||
    response === "none"
  ) {
    return response;
  } else {
    return new Error(
      `Move invalid: "${response}"\nExpected "north" "south" "east" "west" or "none"`
    );
  }
}

function createMovePayload(state: State) {
  return [
    state.p1.position.x,
    state.p1.position.y,
    state.p2.position.x,
    state.p2.position.y,
    state.ball.position.x,
    state.ball.position.y,
  ].join(",");
}
