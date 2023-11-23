
import { Mat4, mat4 } from "wgpu-matrix";
import { Renderer } from "../Renderer";
import { Geometry } from "./Geometry";
import { Material } from "../Material";
import { INSTANCE_BUFFER_LAYOUT } from ".";

export interface ModelDescriptor {
  /**
   * Renderer context.
   */
  renderer: Renderer;

  /**
   * Identifier of the model.
   */
  label: string;

  /**
   * Model geometry.
   */
  geometry: Geometry;
  
  /**
   * Material properties.
   */
  material: Material;

  /**
   * Instanced count (must be at least 1).
   */
  instanceCount?: number;
}


/**
 * A model is a combination of a geometry, a material, and a set of transforms (for instanced models).
 */
export class Model {
  private renderer: Renderer;
  readonly geometry: Geometry;
  readonly material: Material;

  readonly instanceCount: number;
  readonly instances: GPUBuffer;

  constructor(descriptor: ModelDescriptor) {
    if (descriptor.instanceCount !== undefined && descriptor.instanceCount < 1) {
      throw new Error(`Model instance count must be at least 1`);
    }
    this.renderer = descriptor.renderer;
    this.geometry = descriptor.geometry;
    this.material = descriptor.material;
    this.instanceCount = descriptor.instanceCount ?? 1;
    this.instances = descriptor.renderer.device.createBuffer({
      label: `ModelInstances(${descriptor.label})`,
      size: this.instanceCount * INSTANCE_BUFFER_LAYOUT.arrayStride,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    // Default position of the models.
    const identity = mat4.identity();
    for (let i = 0; i < this.instanceCount; i++) {
      this.transform(identity, i);
    }
  }

  /**
   * Set the transform of the model (or an instance if an index is provided).
   * 
   * @param transform
   * @param index
   */
  transform(transform: Mat4, index = 0) {
    const normal = mat4.invert(transform);
    mat4.transpose(normal, normal);

    const buffer = new Float32Array([...transform, ...normal]);
    this.renderer.device.queue.writeBuffer(
      this.instances,
      index * INSTANCE_BUFFER_LAYOUT.arrayStride,
      buffer, 
      0,
      buffer.length
    );
  }

  /**
   * Dispose of the model.
   */
  dispose() {
    this.instances.destroy();
  }
}