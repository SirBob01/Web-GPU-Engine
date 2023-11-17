export interface VertexPosition {
  type: 'position';
  positions: Float32Array;
}

export interface VertexPositionColor {
  type: 'position-color';
  positions: Float32Array;
  colors: Float32Array;
}

export interface VertexPositionUV {
  type: 'position-uv';
  positions: Float32Array;
  uvs: Float32Array;
}

export interface VertexPositionNormal {
  type: 'position-normal';
  positions: Float32Array;
  normals: Float32Array;
}

export interface VertexPositionNormalColor {
  type: 'position-normal-color';
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
}

export interface VertexPositionNormalUV {
  type: 'position-normal-uv';
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
}

export interface VertexPositionNormalTangentUV {
  type: 'position-normal-tangent-uv';
  positions: Float32Array;
  normals: Float32Array;
  tangents: Float32Array;
  uvs: Float32Array;
}

/**
 * Different vertex array buffer layouts.
 */
export type VertexLayout = VertexPosition | VertexPositionColor | VertexPositionUV | VertexPositionNormal | VertexPositionNormalColor | VertexPositionNormalUV | VertexPositionNormalTangentUV;

/**
 * GPU vertex buffer layout definitions.
 */
export const VERTEX_BUFFER_LAYOUTS: Record<VertexLayout['type'], GPUVertexBufferLayout> = {
  'position': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
    ],
    arrayStride: 12,
    stepMode: "vertex",
  },
  'position-color': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // color
        offset: 12,
        format: "float32x4",
      },
    ],
    arrayStride: 28,
    stepMode: "vertex",
  },
  'position-uv': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // uv
        offset: 12,
        format: "float32x2",
      },
    ],
    arrayStride: 20,
    stepMode: "vertex",
  },
  'position-normal': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // normal
        offset: 12,
        format: "float32x3",
      },
    ],
    arrayStride: 24,
    stepMode: "vertex",
  },
  'position-normal-color': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // normal
        offset: 12,
        format: "float32x3",
      },
      {
        shaderLocation: 2, // color
        offset: 24,
        format: "float32x4",
      },
    ],
    arrayStride: 40,
    stepMode: "vertex",
  },
  'position-normal-uv': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // normal
        offset: 12,
        format: "float32x3",
      },
      {
        shaderLocation: 2, // uv
        offset: 24,
        format: "float32x2",
      },
    ],
    arrayStride: 32,
    stepMode: "vertex",
  },
  'position-normal-tangent-uv': {
    attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: "float32x3",
      },
      {
        shaderLocation: 1, // normal
        offset: 12,
        format: "float32x3",
      },
      {
        shaderLocation: 2, // tangent
        offset: 24,
        format: "float32x3",
      },
      {
        shaderLocation: 3, // uv
        offset: 36,
        format: "float32x2",
      },
    ],
    arrayStride: 44,
    stepMode: "vertex",
  },
}