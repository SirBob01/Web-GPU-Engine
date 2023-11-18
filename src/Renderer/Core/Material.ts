import { Color } from "./Color";
import { Renderer } from "../Renderer";
import { Texture } from "./Texture";
import { Uniform } from "./Uniform";
import { VertexLayout } from "./Vertex";

let materialId = 0;

export interface MaterialDescriptor {
  renderer: Renderer;
  shaderCode: string;
  uniforms: Record<string, Uniform>;
  primitiveTopology?: GPUPrimitiveTopology;
  diffuseColor?: Color;
  diffuseTexture?: Texture;
  culling?: GPUCullMode;
}

/**
 * GPU allocated material.
 */
export class Material {
  readonly id = materialId++;
  readonly shaderModules: Record<VertexLayout['type'], GPUShaderModule>;
  readonly uniforms: Record<string, Uniform>;
  readonly primitiveToplogy: GPUPrimitiveTopology;
  readonly culling: GPUCullMode;
  readonly diffuseTexture: Texture | null = null;
  readonly diffuseColor: Color;

  constructor(descriptor: MaterialDescriptor) {
    this.shaderModules = descriptor.renderer.getShaderModules(descriptor.shaderCode);
    this.uniforms = descriptor.uniforms;
    this.culling = descriptor.culling ?? 'back';
    this.primitiveToplogy = descriptor.primitiveTopology ?? 'triangle-list';
    this.diffuseTexture = descriptor.diffuseTexture ?? null;
    this.diffuseColor = descriptor.diffuseColor ?? new Color(1, 1, 1);
  }

  /**
   * Dispose of the material.
   */
  dispose() {
  }
}