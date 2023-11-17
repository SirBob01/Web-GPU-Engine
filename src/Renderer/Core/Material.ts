import { Renderer } from "../Renderer";
import { Texture } from "./Texture";

let materialId = 0;

export interface MaterialDescriptor {
  renderer: Renderer;
  shaderCode: string;
  primitiveTopology?: GPUPrimitiveTopology;
  diffuseColor?: [number, number, number];
  diffuseTexture?: Texture;
}

/**
 * GPU allocated material.
 */
export class Material {
  readonly id = materialId++;
  readonly shader: GPUShaderModule;
  readonly primitiveToplogy: GPUPrimitiveTopology;
  readonly diffuseTexture: Texture | null = null;
  readonly diffuseColor: [number, number, number];

  constructor(descriptor: MaterialDescriptor) {
    this.shader = descriptor.renderer.device.createShaderModule({
      code: descriptor.shaderCode,
    });
    this.primitiveToplogy = descriptor.primitiveTopology ?? 'triangle-list';
    this.diffuseTexture = descriptor.diffuseTexture ?? null;
    this.diffuseColor = descriptor.diffuseColor ?? [1, 1, 1];
  }

  /**
   * Dispose of the material.
   */
  dispose() {
  }
}