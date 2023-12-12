import {
  ArcRotateCamera,
  Scene,
  Vector3,
  PointerEventTypes,
  CubicEase,
  BackEase,
  KeyboardEventTypes,
} from "@babylonjs/core";
import { GameStatus } from "zilch-game-engine";
import {
  addStyle,
  getNearestStep,
  runAnimation,
  stopAnimations,
} from "./utils";

const INITIAL_ALPHA = Math.PI * 2.4;
const INITIAL_BETA = Math.PI * 0.26;

export class Camera {
  #camera: ArcRotateCamera;
  #topView = false;
  #status: GameStatus = "not-started";

  constructor(scene: Scene) {
    this.#camera = new ArcRotateCamera(
      "camera",
      INITIAL_ALPHA,
      INITIAL_BETA,
      18,
      new Vector3(0, 3, 0),
      scene
    );

    this.#camera.lowerRadiusLimit = 16.5;
    this.#camera.upperRadiusLimit = 35;
    this.#camera.panningSensibility = 0;
    this.#camera.upperBetaLimit = Math.PI * 0.5;
    this.#camera.useAutoRotationBehavior = true;
    this.#camera.attachControl();

    runAnimation(this.#camera, [
      {
        property: "radius",
        frames: {
          0: this.#camera.radius,
          90: 27,
        },
        easingFunction: new BackEase(),
        easingMode: "out",
      },
    ]);

    addStyle(`
      canvas {
        cursor: grab;
      }

      canvas.moving {
        cursor: grabbing;
      }
    `);

    const canvas = document.querySelector("canvas")!;

    const updateTopView = () => {
      this.#topView = this.#camera.beta < 0.3;

      if (this.#topView) {
        this.#camera.useAutoRotationBehavior = false;
        this.#animateTo(
          getNearestStep(Math.PI, this.#camera.alpha, Math.PI / 2),
          0
        );
      } else if (this.#status === "not-started") {
        this.#camera.useAutoRotationBehavior = true;
      }
    };

    scene.onKeyboardObservable.add((event) => {
      if (event.type === KeyboardEventTypes.KEYDOWN) {
        stopAnimations(this.#camera);
      }

      if (event.type === KeyboardEventTypes.KEYUP) {
        updateTopView();
      }
    });

    scene.onPointerObservable.add((event) => {
      if (event.type === PointerEventTypes.POINTERDOWN) {
        canvas.classList.add("moving");
        stopAnimations(this.#camera);
      }

      if (event.type === PointerEventTypes.POINTERUP) {
        canvas.classList.remove("moving");
        updateTopView();
      }
    });
  }

  setStatus(newStatus: GameStatus) {
    if (newStatus === "in-progress" && this.#status !== "in-progress") {
      this.#camera.useAutoRotationBehavior = false;

      if (!this.#topView) {
        this.#animateTo(
          getNearestStep(INITIAL_ALPHA, this.#camera.alpha, Math.PI / 2),
          INITIAL_BETA
        );
      }
    }

    if (
      newStatus === "not-started" &&
      this.#status !== "not-started" &&
      !this.#topView
    ) {
      this.#camera.useAutoRotationBehavior = true;
    }

    this.#status = newStatus;
  }

  #animateTo(alpha: number, beta: number) {
    runAnimation(this.#camera, [
      {
        property: "alpha",
        frames: {
          0: this.#camera.alpha,
          30: alpha,
        },
        easingFunction: new CubicEase(),
      },
      {
        property: "beta",
        frames: {
          0: this.#camera.beta,
          30: beta,
        },
        easingFunction: new CubicEase(),
      },
    ]);
  }
}
