import { Color3 } from "@babylonjs/core";
import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { ZilchNamespace } from "zilch-game-engine";
import { Move } from "./play";

/**
 * User facing config schema
 */
type RawConfig = FromSchema<typeof configSchema>;

export interface Config {
  serveTo: "east" | "west" | "random";
}

export interface Point {
  x: number;
  y: number;
}

export interface Ball {
  speed: number;
  angle: number;
  position: Point;
  hit: Hit;
  intercept: Point | null;
}

export interface Player {
  wins: number;
  position: Point;
  lastMove: Move;
}

interface CircleAnnotation {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: Color3;
}

export interface Hit {
  hitX: number;
  hitZ: number;
  landX: number;
}

export interface State {
  index: number;
  p1: Player;
  p2: Player;
  ball: Ball;
  lastBall: Ball | null;
  annotations: CircleAnnotation[];
}

declare global {
  const Zilch: ZilchNamespace<RawConfig, Config, State>;
}

/**
 * Schema for the JSON users can input as part of
 * game setup.
 */
const configSchema = {
  type: "object",
  required: ["serveTo"],
  properties: {
    serveTo: {
      description:
        "The direction the ball will start moving at the beginning of the game.",
      enum: ["east", "west", "random"],
    },
  },
} as const satisfies JSONSchema;
Zilch.configSchema = configSchema;

Zilch.configPresets = [
  {
    name: "Standard",
    // prettier-ignore
    value: `{\n` +
    `  // Serve to "east" or "west" paddle or "random"\n` +
    `  "serveTo": "random"\n` +
    `}\n`,
  },
];

Zilch.parseConfig = (rawConfig) => {
  return {
    serveTo: rawConfig.serveTo,
  };
};

Zilch.serializeConfig = (config) => {
  return config.serveTo.toString();
};

Zilch.summarizeConfig = (config) => {
  return `serve to ${config.serveTo} paddle`;
};
