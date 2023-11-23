import { Color, Texture, Uniform, VertexLayout } from "../Core";
import { Renderer } from "../Renderer";

export interface MaterialDescriptor {
  renderer: Renderer;
  shaderCode: string;
  uniforms: Record<string, Uniform>;
  topology?: GPUPrimitiveTopology;
  winding?: GPUFrontFace;
  diffuseColor?: Color;
  diffuseTexture?: Texture;
  culling?: GPUCullMode;
}

/**
 * GPU allocated material.
 */
export class Material {
  readonly shaderModules: Record<VertexLayout['type'], GPUShaderModule>;
  readonly uniforms: Record<string, Uniform>;
  protected _needsUpdate: boolean;

  private _topology: GPUPrimitiveTopology;
  private _winding: GPUFrontFace;
  private _culling: GPUCullMode;
  private _diffuseTexture: Texture | null = null;
  private _diffuseColor: Color;

  constructor(descriptor: MaterialDescriptor) {
    this.shaderModules = descriptor.renderer.getShaderModules(descriptor.shaderCode);
    this.uniforms = descriptor.uniforms;
    this._needsUpdate = true;

    this._culling = descriptor.culling ?? 'back';
    this._topology = descriptor.topology ?? 'triangle-list';
    this._winding = descriptor.winding ?? 'ccw';
    this._diffuseTexture = descriptor.diffuseTexture ?? null;
    this._diffuseColor = descriptor.diffuseColor ?? new Color(1, 1, 1);
  }

  /**
   * Used internally by the engine to check if the material's associated pipeline needs to be rebuilt.
   */
  get needsUpdate() {
    return this._needsUpdate;
  }

  /**
   * Get the culling mode of the material.
   */
  get culling(): GPUCullMode {
    return this._culling;
  }

  /**
   * Get the topology definition of the material.
   */
  get topology(): GPUPrimitiveTopology {
    return this._topology;
  }

  /**
   * Get the winding direction of the vertices.
   */
  get winding(): GPUFrontFace {
    return this._winding;
  }

  /**
   * Get the diffuse texture of the material.
   */
  get diffuseTexture(): Texture | null {
    return this._diffuseTexture;
  }


  /**
   * Get the diffuse color of the material.
   */
  get diffuseColor(): Color {
    return this._diffuseColor;
  }

  /**
   * Set the culling mode of the material.
   */
  set culling(culling: GPUCullMode) {
    this._culling = culling;
    this._needsUpdate = true;
  }

  /**
   * Set the topology definition of the material.
   */
  set topology(topology: GPUPrimitiveTopology) {
    this._topology = topology;
    this._needsUpdate = true;
  }

  /**
   * Set the winding direction of the vertices. 
   */
  set winding(winding: GPUFrontFace) {
    this._winding = winding;
    this._needsUpdate = true;
  }

  /**
   * Set the diffuse texture of the material.
   * 
   * If none, the engine will use the diffuse color.
   */
  set diffuseTexture(texture: Texture | null) {
    this._diffuseTexture = texture;
    this._needsUpdate = true;
  }

  /**
   * Set the diffuse color of the material.
   */
  set diffuseColor(color: Color) {
    this._diffuseColor = color;
    this._needsUpdate = true;
  }

  /**
   * Dispose of the material.
   */
  dispose() {
  }
}