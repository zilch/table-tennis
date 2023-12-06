import {
  DynamicTexture,
  MeshBuilder,
  PBRMaterial,
  Scene,
} from "@babylonjs/core";

export class Ground {
  constructor(scene: Scene) {
    const radius = 40;

    // Texture
    const groundTexture = new DynamicTexture(
      "GroundTexture",
      { width: radius * 2, height: radius * 2 },
      scene,
      false
    );
    const ctx = groundTexture.getContext();
    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius
    );
    gradient.addColorStop(0, "rgba(56, 62, 71, .5)");
    gradient.addColorStop(1, "rgba(56, 62, 71, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, radius * 2, radius * 2);
    groundTexture.update();

    // Material
    const groundMaterial = new PBRMaterial("GroundMaterial", scene!);
    groundMaterial.roughness = 0.8;
    groundTexture.hasAlpha = true;
    groundMaterial.albedoTexture = groundTexture;
    groundMaterial.useAlphaFromAlbedoTexture = true;

    // Mesh
    const groundMesh = MeshBuilder.CreateDisc(
      "GroundMesh",
      {
        radius: radius,
        tessellation: 30,
      },
      scene
    );
    groundMesh.material = groundMaterial;
    groundMesh.rotation.x = Math.PI / 2;
    groundMesh.position.y = -1.35;
  }
}
