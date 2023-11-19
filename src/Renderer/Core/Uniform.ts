import { Renderer } from "../Renderer";
import { align } from "../Utils";

export interface UniformDescriptor {
  /**
   * Renderer context.
   */
  renderer: Renderer;

  /**
   * Identifier of the uniform buffer.
   */
  label: string;

  /**
   * Size of the buffer.
   */
  size: number;
}

/**
 * Uniform buffer object.
 */
export class Uniform {
  private renderer: Renderer;
  readonly buffer: GPUBuffer;

  constructor(descriptor: UniformDescriptor) {
    this.renderer = descriptor.renderer;
    this.buffer = descriptor.renderer.device.createBuffer({
      label: descriptor.label,
      size: align(descriptor.size),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Write some data onto the buffer.
   *
   * @param data
   * @param dst_offset
   */
  write(data: ArrayBufferView, dst_offset = 0) {
    this.renderer.device.queue.writeBuffer(this.buffer, dst_offset, data.buffer, data.byteOffset, data.byteLength);
  }

  /**
   * Dispose the uniform buffer.
   */
  dispose() {
    this.buffer.destroy();
  }
}