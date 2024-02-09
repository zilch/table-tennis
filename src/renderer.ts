import type { RenderParams } from "zilch-game-engine";
import type { Ball, Config, Player, Point, State } from "./config";
import {
  Engine,
  Scene,
  SceneLoader,
  ShadowGenerator,
  SpotLight,
  GlowLayer,
  Vector3,
  AbstractMesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
  PBRMaterial,
  CircleEase,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { runAnimation, toBabylonColor } from "./ui/utils";
import { Camera } from "./ui/Camera";
import { Ground } from "./ui/Ground";
import { getBallZ } from "./ui/math";

const boardMultiplier = 10.4 / 35;
const tableHeight = 4.87;
const colorFallback = "#5E4123";

Zilch.Renderer = class Renderer {
  #engine: Engine;
  #scene: Scene;

  #camera: Camera;

  #paddle1: Paddle;
  #paddle2: Paddle;
  #ball: BallManager;

  #annotations: AbstractMesh[] = [];
  #lastUpdate = 0;

  constructor(engine: Engine, scene: Scene) {
    this.#engine = engine;
    this.#scene = scene;

    scene.autoClear = false;
    scene.autoClearDepthAndStencil = false;
    scene.skipPointerMovePicking = true;
    scene.skipPointerDownPicking = true;
    scene.skipPointerUpPicking = true;
    // scene.skipFrustumClipping = true;
    scene.clearColor = toBabylonColor("#2F343C").toColor4().toLinearSpace();

    const paddle1Mesh = this.#scene.meshes.find(
      (mesh) => mesh.name === "Paddle1"
    )!;
    this.#paddle1 = new Paddle(
      paddle1Mesh,
      colorFallback,
      {
        position: { x: 0, y: 0 },
        wins: 0,
        lastMove: "none",
      },
      "west"
    );

    const paddle2Mesh = this.#scene.meshes.find(
      (mesh) => mesh.name === "Paddle2"
    )!;
    this.#paddle2 = new Paddle(
      paddle2Mesh,
      colorFallback,
      {
        position: { x: 0, y: 0 },
        wins: 0,
        lastMove: "none",
      },
      "east"
    );

    const ballMesh = this.#scene.meshes.find((mesh) => mesh.name === "Ball")!;
    this.#ball = new BallManager(
      ballMesh,
      {
        position: { x: 0, y: 0 },
        intercept: null,
        angle: 0,
        speed: 0,
        hit: { landX: 0, hitX: 0, hitZ: 0 },
      },
      null
    );

    this.#camera = new Camera(scene);

    new Ground(scene);
    this.#createShadows();

    const gl = new GlowLayer("GlowLayer");
    gl.intensity = 0.8;

    this.#engine.runRenderLoop(() => {
      this.#scene.render();
      this.#paddle1.updateOnFrame(this.#ball.getPosition());
      this.#paddle2.updateOnFrame(this.#ball.getPosition());
    });
  }

  static async create(canvas: HTMLCanvasElement) {
    const engine = new Engine(canvas);
    engine.loadingScreen = new (class {
      hideLoadingUI() {}
      displayLoadingUI() {}
      loadingUIBackgroundColor = "";
      loadingUIText = "";
    })();

    const scene = await SceneLoader.LoadAsync(
      ASSETS_PATH + "/",
      "table-tennis.glb",
      engine
    );

    return new Renderer(engine, scene);
  }

  render({ current, previous }: RenderParams<State, Config>) {
    if (
      current.dimensions.height !== previous?.dimensions.height ||
      current.dimensions.width !== previous.dimensions.width
    ) {
      this.#engine.resize();
    }

    this.#annotations.forEach((mesh) => mesh.dispose());
    current.state?.annotations.forEach((annotation) => {
      const mat = new StandardMaterial("");
      mat.diffuseColor = annotation.color;
      mat.specularColor = annotation.color;

      const sphere = MeshBuilder.CreateSphere("Annotation", {
        segments: 6,
      });
      sphere.scaling = Vector3.One().scale(annotation.radius * boardMultiplier);

      sphere.position = toBoardPosition(annotation.x, annotation.y);
      sphere.position.y = annotation.z * boardMultiplier + tableHeight;
      sphere.material = mat;

      this.#annotations.push(sphere);
    });

    this.#camera.setStatus(current.status);

    if (current.botColors[0] !== previous?.botColors[0]) {
      this.#paddle1.updateColor(current.botColors[0] ?? colorFallback);
    }

    if (current.botColors[1] !== previous?.botColors[1]) {
      this.#paddle2.updateColor(current.botColors[1] ?? colorFallback);
    }

    const state: State = current.state ?? {
      index: 0,
      annotations: [],
      lastBall: null,
      ball: {
        position: { x: 0, y: 0 },
        intercept: null,
        hit: {
          landX: 10,
          hitX: -10,
          hitZ: 1,
        },
        speed: 1,
        angle: 10,
      },
      p1: {
        wins: 0,
        lastMove: "none",
        position: {
          x: -34,
          y: -10,
        },
      },
      p2: {
        wins: 0,
        lastMove: "none",
        position: {
          x: 34,
          y: 10,
        },
      },
    };

    const skipAnimate =
      (current.state?.index ?? 0) < (previous?.state?.index ?? 0) ||
      Date.now() - this.#lastUpdate < 150;
    this.#lastUpdate = Date.now();

    this.#paddle1.update(state.p1, skipAnimate);
    this.#paddle2.update(state.p2, skipAnimate);
    this.#ball.update(
      state.ball,
      state.lastBall,
      skipAnimate,
      state.ball.intercept
        ? state.ball.intercept.x > 0
          ? this.#paddle2
          : this.#paddle1
        : null
    );
  }

  #createShadows() {
    const shadowGenerators: ShadowGenerator[] = [];
    this.#scene.lights.forEach((light) => {
      light.intensity /= 150;
      if (light instanceof SpotLight) {
        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerators.push(shadowGenerator);
      }
    });

    this.#scene.meshes.forEach((mesh) => {
      shadowGenerators.forEach((shadowGenerator) => {
        shadowGenerator.getShadowMap()?.renderList?.push(mesh);
      });

      if (!mesh.isAnInstance) {
        mesh.receiveShadows = true;
      }
    });
  }
};

function toBoardPosition(x: number, y: number) {
  const m = 10.4 / 35;
  return new Vector3(-x * m, 5.8, -y * m);
}

class BallManager {
  private position: Point;

  constructor(private mesh: AbstractMesh, ball: Ball, lastBall: Ball | null) {
    this.position = ball.position;
    this.mesh.position = toBoardPosition(this.position.x, this.position.y);
    this.update(ball, lastBall, true, null);
  }

  getPosition() {
    return this.mesh.position;
  }

  update(
    ball: Ball,
    lastBall: Ball | null,
    skipAnimate: boolean,
    paddle: Paddle | null
  ) {
    const endBoardPosition = toBoardPosition(-ball.position.x, ball.position.y);
    const finalFrame = getFinalFrame(this.mesh.getScene());

    if (skipAnimate) {
      this.mesh.position.x = endBoardPosition.x;
      this.mesh.position.z = endBoardPosition.z;
      this.mesh.position.y = this.#createFrames(
        finalFrame,
        ball,
        endBoardPosition
      )[finalFrame];
      return;
    }

    if (ball.intercept) {
      const interceptBoardPosition = toBoardPosition(
        -ball.intercept.x,
        ball.intercept.y
      );
      const startToInterceptDistance = Math.sqrt(
        (ball.intercept.x - this.position.x) ** 2 +
          (ball.intercept.y - this.position.y) ** 2
      );
      const interceptToEndDistance = Math.sqrt(
        (ball.intercept.x - ball.position.x) ** 2 +
          (ball.intercept.y - ball.position.y) ** 2
      );
      const totalDistance = startToInterceptDistance + interceptToEndDistance;
      const interceptFrame = Math.round(
        totalDistance === 0
          ? finalFrame / 2
          : (startToInterceptDistance / totalDistance) * finalFrame
      );

      const positionYFrames = this.#createFrames(
        finalFrame,
        ball,
        endBoardPosition,
        lastBall
          ? {
              frame: interceptFrame,
              boardPosition: interceptBoardPosition,
              lastBall,
            }
          : undefined
      );

      if (paddle) {
        if (interceptFrame < 3) {
          paddle.showHitIndicator(
            new Vector3(
              -interceptBoardPosition.x,
              positionYFrames[interceptFrame],
              interceptBoardPosition.z
            )
          );
        } else {
          runAnimation(this.mesh, [
            {
              property: "scaling.x",
              frames: {
                0: 1,
                [interceptFrame - 2]: 1,
              },
            },
          ]).then(() => {
            paddle.showHitIndicator(
              new Vector3(
                -interceptBoardPosition.x,
                positionYFrames[interceptFrame],
                interceptBoardPosition.z
              )
            );
          });
        }
      }

      runAnimation(this.mesh, [
        {
          property: "position.x",
          frames: {
            0: this.mesh.position.x,
            [interceptFrame]: interceptBoardPosition.x,
            [finalFrame]: endBoardPosition.x,
          },
        },
        {
          property: "position.z",
          frames: {
            0: this.mesh.position.z,
            [interceptFrame]: interceptBoardPosition.z,
            [finalFrame]: endBoardPosition.z,
          },
        },
        {
          property: "position.y",
          frames: positionYFrames,
        },
      ]);
    } else {
      runAnimation(this.mesh, [
        {
          property: "position.x",
          frames: {
            0: this.mesh.position.x,
            [finalFrame]: endBoardPosition.x,
          },
        },
        {
          property: "position.z",
          frames: {
            0: this.mesh.position.z,
            [finalFrame]: endBoardPosition.z,
          },
        },
        {
          property: "position.y",
          frames: this.#createFrames(finalFrame, ball, endBoardPosition),
        },
      ]);
    }

    this.position = ball.position;
  }

  #createFrames(
    finalFrame: number,
    ball: Ball,
    endBoardPosition: Vector3,
    intercept?: { frame: number; boardPosition: Vector3; lastBall: Ball }
  ) {
    const frames: Record<number, number> = {};

    for (let frame = 0; frame <= finalFrame; frame++) {
      let hit = ball.hit;
      let ballX: number = 0;

      if (intercept && intercept.frame > 0 && intercept.frame < finalFrame) {
        if (frame <= intercept.frame) {
          hit = intercept.lastBall.hit;
          ballX =
            this.mesh.position.x +
            (frame / intercept.frame) *
              (intercept.boardPosition.x - this.mesh.position.x);
        } else {
          ballX =
            intercept.boardPosition.x +
            ((frame - intercept.frame) / (finalFrame - intercept.frame)) *
              (endBoardPosition.x - intercept.boardPosition.x);
        }
      } else {
        ballX =
          (frame / finalFrame) * (endBoardPosition.x - this.mesh.position.x) +
          this.mesh.position.x;
      }

      frames[frame] =
        getBallZ(ballX / boardMultiplier, hit) * boardMultiplier + tableHeight;
    }

    return frames;
  }
}

class Paddle {
  #node = new TransformNode("Paddle");
  #ringsMaterial = new PBRMaterial("PaddlePlayerColorIndicatorMaterial");
  #hitIndicatorMaterial = new PBRMaterial("HitIndicatorMaterial");
  #hitIndicator1: AbstractMesh;
  #hitIndicator2: AbstractMesh;

  constructor(
    private mesh: AbstractMesh,
    color: string,
    player: Player,
    private side: "east" | "west"
  ) {
    this.updateColor(color);

    this.#hitIndicator1 = MeshBuilder.CreateCylinder("HitIndicator", {
      height: 0.05,
      diameter: 2,
      tessellation: 18,
    });
    this.#hitIndicator1.rotation.z = Math.PI / 2;
    this.#hitIndicator1.material = this.#hitIndicatorMaterial;
    this.#hitIndicator2 = MeshBuilder.CreateCylinder("HitIndicator", {
      height: 0.05,
      diameter: 1.7,
      tessellation: 14,
    });
    this.#hitIndicator2.rotation.z = Math.PI / 2;
    this.#hitIndicator2.material = this.#hitIndicatorMaterial;
    this.#hitIndicatorMaterial.alpha = 0;

    for (let i = 0; i < 3; i++) {
      const colorRing = MeshBuilder.CreateCylinder("PlayerColorRing", {
        height: 0.03,
        diameter: 0.37,
        tessellation: 8,
      });
      colorRing.position.y = 0.02;
      colorRing.position.z = 1.64 + i * 0.08;
      colorRing.rotation.x = Math.PI / 2;
      colorRing.material = this.#ringsMaterial;
      colorRing.scaling.z = 0.7;
      colorRing.parent = mesh;
    }
    mesh.parent = this.#node;

    this.mesh.rotationQuaternion = null;
    this.mesh.rotation = new Vector3(-Math.PI / 2, Math.PI / 2, 0);
    this.update(player, true);
  }

  showHitIndicator(position: Vector3) {
    this.#hitIndicator1.position = position.clone();
    this.#hitIndicator2.position = position.clone();
    this.#hitIndicator2.position.x += (this.side === "west" ? 1 : -1) * 0.1;
    const easingFunction = new CircleEase();
    const finalFrame = 18;

    runAnimation(this.#hitIndicatorMaterial, [
      {
        property: "alpha",
        easingFunction,
        easingMode: "out",
        frames: {
          0: 0.4,
          [finalFrame]: 0,
        },
      },
    ]);

    runAnimation(
      this.#hitIndicator1,
      ["x", "y", "z"].map((prop) => {
        return {
          property: "scaling." + prop,
          easingFunction,
          easingMode: "out",
          frames: {
            0: 0,
            [finalFrame]: 1,
          },
        };
      })
    );

    runAnimation(
      this.#hitIndicator2,
      ["x", "y", "z"].map((prop) => {
        return {
          property: "scaling." + prop,
          easingFunction,
          easingMode: "out",
          frames: {
            10: 0,
            [finalFrame + 10]: 1,
          },
        };
      })
    );
  }

  updateColor(color: string) {
    this.#ringsMaterial.albedoColor = Color3.FromHexString(color);
    this.#ringsMaterial.emissiveColor = Color3.FromHexString(color);
    this.#hitIndicatorMaterial.albedoColor = Color3.FromHexString(color);
    this.#hitIndicatorMaterial.emissiveColor = Color3.FromHexString(color);
  }

  updateOnFrame(ballPosition: Vector3) {
    const dist = (x1: number, y1: number, x2: number, y2: number) =>
      Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const distanceToBall = dist(
      -this.#node.position.x,
      this.#node.position.z,
      ballPosition.x,
      ballPosition.z
    );
    const rampDistance = 16;
    const percentage =
      -Math.min(0, distanceToBall - rampDistance) / rampDistance;
    const smoothPercentage = (Math.cos(percentage * Math.PI) - 1) / -2;
    this.#node.position.y = Math.max(
      smoothPercentage * (ballPosition.y - 2 - tableHeight) + tableHeight + 2,
      tableHeight + 0.75
    );

    let hitOffset =
      1.3 *
      Math.sin(
        Math.min(Math.abs((-ballPosition.x - this.#node.position.x) / 15), 1) *
          Math.PI
      );

    if (this.side === "west") {
      hitOffset *= -1;
    }

    this.mesh.position.x = hitOffset;
  }

  getPosition() {
    return this.#node.position;
  }

  update(player: Player, skipAnimate: boolean) {
    const newPosition = toBoardPosition(player.position.x, player.position.y);

    if (skipAnimate) {
      this.#node.position.x = newPosition.x;
      this.#node.position.z = newPosition.z;
      return;
    }

    const finalFrame = getFinalFrame(this.mesh.getScene());

    runAnimation(this.#node, [
      {
        property: "position.x",
        frames: {
          0: this.#node.position.x,
          [finalFrame]: newPosition.x,
        },
      },
      {
        property: "position.z",
        frames: {
          0: this.#node.position.z,
          [finalFrame]: newPosition.z,
        },
      },
    ]);
  }
}

function getFinalFrame(scene: Scene) {
  const ms = 120;
  let fps = scene.getEngine().getFps();
  if (Number.isNaN(fps) || !Number.isFinite(fps)) {
    fps = 120;
  }
  const framesPerMillisecond = fps / 1000;
  return Math.round(ms * framesPerMillisecond);
}
