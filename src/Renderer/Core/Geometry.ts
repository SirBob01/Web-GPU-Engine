import { Renderer } from "../Renderer";
import { align } from "../Utils";
import { VERTEX_BUFFER_LAYOUTS, VertexLayout } from './Vertex';

export interface GeometryDescriptor {
  /**
   * Renderer context.
   */
  renderer: Renderer;

  /**
   * Identifier for the geometry.
   */
  label: string;

  /**
   * Vertex arrays.
   */
  vertices: VertexLayout;

  /**
   * Index array.
   */
  indices?: number[];
}

/**
 * GPU allocated geometry buffers.
 */
export class Geometry {
  private renderer: Renderer;
  readonly vertexCount: number;
  readonly indexCount: number;

  readonly layout: VertexLayout['type'];
  readonly indexFormat: GPUIndexFormat;

  readonly vertices: GPUBuffer;
  readonly indices: GPUBuffer;

  constructor(descriptor: GeometryDescriptor) {
    this.renderer = descriptor.renderer;
    this.vertexCount = descriptor.vertices.positions.length / 3;
    const indices = descriptor.indices ?? Array.from(new Array(this.vertexCount), (_, i) => i);
    this.indexCount = indices.length;
   
    this.layout = descriptor.vertices.type;
    this.indexFormat = this.needs32Bit(indices) ? 'uint32' : 'uint16';

    this.verifyGeometry(descriptor.vertices, indices);
    this.vertices = this.buildVertexArray(descriptor.label, descriptor.vertices);
    this.indices = this.buildIndexArray(descriptor.label, indices);
  }

  private needs32Bit(array: number[]) {
    for (const i of array) {
      if (i > 65535) {
        return true;
      }
    }
    return false;
  }

  private verifyGeometry(vertices: VertexLayout, indices?: number[]) {
    if (vertices.positions.length % 3 !== 0) {
      throw new Error('Invalid position array length.');
    }

    if (indices) {
      for (const index of indices) {
        if (index < 0 || index >= this.vertexCount) {
          throw new Error("Index array out of bounds.");
        }
      }
    }

    if ('normals' in vertices && vertices.normals.length / 3 !== this.vertexCount) {
      throw new Error("Normal array length must match position array length.");
    }
    if ('colors' in vertices && vertices.colors.length / 4 !== this.vertexCount) {
      throw new Error("Color array length must match position array length.");
    }
    if ('uvs' in vertices && vertices.uvs.length / 2 !== this.vertexCount) {
      throw new Error("UV array length must match position array length.");
    }
    if ('tangents' in vertices && vertices.tangents.length / 3 !== this.vertexCount) {
      throw new Error("Tangent array length must match position array length.");
    }
  }

  private buildVertexArray(label: string, vertices: VertexLayout) {
    const arrayStride = VERTEX_BUFFER_LAYOUTS[vertices.type].arrayStride;
    const stride = arrayStride / Float32Array.BYTES_PER_ELEMENT;

    const buffer = this.renderer.device.createBuffer({
      label: `VertexBuffer(${label})`,
      size: this.vertexCount * arrayStride,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    const array = new Float32Array(buffer.getMappedRange());
    for (let i = 0; i < this.vertexCount; i++) {
      array[i * stride + 0] = vertices.positions[i * 3 + 0];
      array[i * stride + 1] = vertices.positions[i * 3 + 1];
      array[i * stride + 2] = vertices.positions[i * 3 + 2];
      
      switch (vertices.type) {
        case 'position-color':
          array[i * stride + 3] = vertices.colors[i * 4 + 0];
          array[i * stride + 4] = vertices.colors[i * 4 + 1];
          array[i * stride + 5] = vertices.colors[i * 4 + 2];
          array[i * stride + 6] = vertices.colors[i * 4 + 3];
          break;
        case 'position-uv':
          array[i * stride + 3] = vertices.uvs[i * 2 + 0];
          array[i * stride + 4] = vertices.uvs[i * 2 + 1];
          break;
        case 'position-normal':
          array[i * stride + 3] = vertices.normals[i * 3 + 0];
          array[i * stride + 4] = vertices.normals[i * 3 + 1];
          array[i * stride + 5] = vertices.normals[i * 3 + 2];
          break;
        case 'position-normal-color':
          array[i * stride + 3] = vertices.normals[i * 3 + 0];
          array[i * stride + 4] = vertices.normals[i * 3 + 1];
          array[i * stride + 5] = vertices.normals[i * 3 + 2];
          array[i * stride + 6] = vertices.colors[i * 4 + 0];
          array[i * stride + 7] = vertices.colors[i * 4 + 1];
          array[i * stride + 8] = vertices.colors[i * 4 + 2];
          array[i * stride + 9] = vertices.colors[i * 4 + 3];
          break;
        case 'position-normal-uv':
          array[i * stride + 3] = vertices.normals[i * 3 + 0];
          array[i * stride + 4] = vertices.normals[i * 3 + 1];
          array[i * stride + 5] = vertices.normals[i * 3 + 2];
          array[i * stride + 6] = vertices.uvs[i * 2 + 0];
          array[i * stride + 7] = vertices.uvs[i * 2 + 1];
          break;
        case 'position-normal-tangent-uv':
          array[i * stride + 3] = vertices.normals[i * 3 + 0];
          array[i * stride + 4] = vertices.normals[i * 3 + 1];
          array[i * stride + 5] = vertices.normals[i * 3 + 2];
          array[i * stride + 6] = vertices.tangents[i * 3 + 0];
          array[i * stride + 7] = vertices.tangents[i * 3 + 1];
          array[i * stride + 8] = vertices.tangents[i * 3 + 2];
          array[i * stride + 9] = vertices.uvs[i * 2 + 0];
          array[i * stride + 10] = vertices.uvs[i * 2 + 1];
          break;
        default:
          break;
      }
    }
    buffer.unmap();
    return buffer;
  }

  private buildIndexArray(label: string, indices: number[]) {
    const indexSize = this.indexFormat === 'uint32' ? Uint32Array.BYTES_PER_ELEMENT : Uint16Array.BYTES_PER_ELEMENT;
    const buffer = this.renderer.device.createBuffer({
      label: `IndexBuffer(${label})`,
      size: align(indices.length * indexSize),
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    let array: Uint32Array | Uint16Array;
    if (this.indexFormat === 'uint32') {
      array = new Uint32Array(buffer.getMappedRange());
    } else {
      array = new Uint16Array(buffer.getMappedRange());
    }
    for (const i of indices) {
      array[i] = i;
    }
    buffer.unmap();
    return buffer;
  }

  /**
   * Destroy the geometry buffers.
   */
  dispose() {
    this.vertices.destroy();
    this.indices.destroy();
  }
}