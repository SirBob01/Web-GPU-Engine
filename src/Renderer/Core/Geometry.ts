import { Renderer } from "../Renderer";
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
  readonly count: number;
  readonly layout: VertexLayout['type'];
  readonly vertices: GPUBuffer;
  readonly indices: GPUBuffer;
  readonly indexFormat: GPUIndexFormat;

  constructor(descriptor: GeometryDescriptor) {
    this.layout = descriptor.vertices.type;
    this.count = descriptor.vertices.positions.length / 3;

    this.verifyGeometry(descriptor.vertices, descriptor.indices);
    const vertexArray = this.buildVertexArray(descriptor.vertices);
    const indexArray = this.buildIndexArray(descriptor.indices);

    this.vertices = descriptor.renderer.device.createBuffer({
      label: `VertexBuffer(${descriptor.label})`,
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.indices = descriptor.renderer.device.createBuffer({
      label: `IndexBuffer(${descriptor.label})`,
      size: indexArray?.byteLength ?? 0,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.indexFormat = indexArray instanceof Uint16Array ? 'uint16' : 'uint32';

    descriptor.renderer.device.queue.writeBuffer(this.vertices, 0, vertexArray, 0, vertexArray.length);
    if (indexArray) {
      descriptor.renderer.device.queue.writeBuffer(this.indices, 0, indexArray, 0, indexArray.length);
    }
  }

  private verifyGeometry(vertices: VertexLayout, indices?: number[]) {
    if (vertices.positions.length % 3 !== 0) {
      throw new Error('Invalid position array length.');
    }

    if (indices) {
      for (const index of indices) {
        if (index < 0 || index >= this.count) {
          throw new Error("Index array out of bounds.");
        }
      }
    }

    if ('normals' in vertices && vertices.normals.length / 3 !== this.count) {
      throw new Error("Normal array length must match position array length.");
    }
    if ('colors' in vertices && vertices.colors.length / 4 !== this.count) {
      throw new Error("Color array length must match position array length.");
    }
    if ('uvs' in vertices && vertices.uvs.length / 2 !== this.count) {
      throw new Error("UV array length must match position array length.");
    }
    if ('tangents' in vertices && vertices.tangents.length / 3 !== this.count) {
      throw new Error("Tangent array length must match position array length.");
    }
  }

  private needs32Bits(array: number[]) {
    for (const num of array) {
      if (num > 65535) return true;
    }
    return false;
  }

  private buildVertexArray(vertices: VertexLayout) {
    const stride = VERTEX_BUFFER_LAYOUTS[vertices.type].arrayStride / 4;
    const array = new Float32Array(this.count * stride);
    for (let i = 0; i < vertices.positions.length / 3; i++) {
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
    return array;
  }

  private buildIndexArray(indices?: number[]) {
    if (!indices) {
      return null;
    } else if (this.needs32Bits(indices)) {
      return new Uint32Array(indices);
    } else {
      return new Uint16Array(indices);
    }
  }

  /**
   * Destroy the geometry buffers.
   */
  dispose() {
    this.vertices.destroy();
    this.indices.destroy();
  }
}