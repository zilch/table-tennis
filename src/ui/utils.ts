import {
  Material,
  EasingFunction,
  Animation,
  Node,
  Color3,
  AbstractMesh,
} from "@babylonjs/core";
import * as csx from "csx";

export function stopAnimations(node: Node | Material) {
  node
    .getScene()
    .animatables.filter((animatable) => animatable.target === node)
    .forEach((animatable) => animatable.stop());
}

export function applyMeshPerfFlags<T extends AbstractMesh>(mesh: T) {
  mesh.isPickable = false;
  mesh.doNotSyncBoundingInfo = true;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}

export function toBabylonColor(colorValue: string) {
  const color = csx.color(colorValue);
  return new Color3(color.red() / 255, color.green() / 255, color.blue() / 255);
}

export function getNearestStep(target: number, current: number, step: number) {
  const diff = target - current;
  const stepCount = Math.round(Math.abs(diff) / step);
  return target + (diff > 0 ? step * -stepCount : step * stepCount);
}

export function runAnimation(
  target: Node | Material,
  animationData: {
    property: string;
    frames: { [frame: number]: unknown };
    easingFunction?: EasingFunction;
    easingMode?: "inout" | "in" | "out";
    delay?: number;
  }[]
) {
  return new Promise<void>((resolve) => {
    const animations = animationData.map((data) => {
      target.animations
        ?.filter((animation) => animation.targetProperty === data.property)
        .forEach((animation) => {
          target.getScene().stopAnimation(target, animation.name);
        });

      const animation = new Animation(
        target.name + "." + data.property + "." + target.uniqueId,
        data.property,
        60,
        Animation.ANIMATIONTYPE_FLOAT
      );

      let minFrame = Infinity;

      const keys = Object.entries(data.frames).map(([frame, value]) => {
        const frameWithDelay = parseInt(frame) + (data.delay ?? 0);
        if (frameWithDelay < minFrame) {
          minFrame = frameWithDelay;
        }
        return {
          frame: frameWithDelay,
          value,
        };
      });

      const firstValue = keys.find((key) => key.frame === minFrame)?.value;
      if ((data.delay ?? 0) > 0 && firstValue !== undefined) {
        keys.unshift({
          frame: 0,
          value: firstValue,
        });
      }

      animation.setKeys(keys);

      if (data.easingFunction) {
        data.easingFunction.setEasingMode(
          {
            in: EasingFunction.EASINGMODE_EASEIN,
            out: EasingFunction.EASINGMODE_EASEOUT,
            inout: EasingFunction.EASINGMODE_EASEINOUT,
          }[data.easingMode ?? "inout"]
        );

        animation.setEasingFunction(data.easingFunction);
      }

      return animation;
    });

    const maxFrame = Math.max(
      ...animationData.flatMap(({ frames, delay }) =>
        Object.keys(frames).map((frame) => parseInt(frame) + (delay ?? 0))
      )
    );

    target
      .getScene()
      .beginDirectAnimation(target, animations, 0, maxFrame, false, 1, resolve);
  });
}

export function addStyle(content: string) {
  const style = document.createElement("style");
  style.innerHTML = content;
  document.head.appendChild(style);
}
