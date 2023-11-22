import { VertexLayout } from "../Core";

/**
 * Determine attributes for vertex shader.
 *
 * @param layout
 * @returns 
 */
function getVertexInput(layout: VertexLayout['type']) {
  switch (layout) {
    case 'position':
      return `
        @location(8) position: vec3f,
      `;
    case 'position-color':
      return `
        @location(8) position: vec3f,
        @location(9) color: vec4f,
      `;
    case 'position-uv':
      return `
        @location(8) position: vec3f,
        @location(9) uv: vec2f,
      `;
    case 'position-normal':
      return `
        @location(8) position: vec3f,
        @location(9) normal: vec3f,
      `;
    case 'position-normal-color':
      return `
        @location(8) position: vec3f,
        @location(9) normal: vec3f,
        @location(10) color: vec4f,
      `;
    case 'position-normal-uv':
      return `
        @location(8) position: vec3f,
        @location(9) normal: vec3f,
        @location(10) uv: vec2f,
      `;
    case 'position-normal-tangent-uv':
      return `
        @location(8) position: vec3f,
        @location(9) normal: vec3f,
        @location(10) tangent: vec3f,
        @location(11) uv: vec2f,
      `;
  }
}

/**
 * Get the vertex transformer code.
 *
 * @param layout
 * @returns 
 */
function getVertexTransformer(layout: VertexLayout['type']) {
  switch (layout) {
    case 'position':
      return `
        result.position = vertex.position;
      `;
    case 'position-color':
      return `
        result.position = vertex.position;
        result.color = vertex.color;
      `;
    case 'position-uv':
      return `
        result.position = vertex.position;
        result.uv = vertex.uv;
      `;
    case 'position-normal':
      return `
        result.position = vertex.position;
        result.normal = vertex.normal;
      `;
    case 'position-normal-color':
      return `
        result.position = vertex.position;
        result.normal = vertex.normal;
        result.color = vertex.color;
      `;
    case 'position-normal-uv':
      return `
        result.position = vertex.position;
        result.normal = vertex.normal;
        result.uv = vertex.uv;
      `;
    case 'position-normal-tangent-uv':
      return `
        result.position = vertex.position;
        result.normal = vertex.normal;
        result.tangent = vertex.tangent;
        result.uv = vertex.uv;
      `;
  }
}

/**
 * Get the vertex shader input structs.
 *
 * @param layout
 * @returns 
 */
export function getVertexShaderInput(layout: VertexLayout['type']) {
  return `
    @group(0) @binding(0) // 1.
    var<uniform> camera: mat4x4<f32>;

    struct InstanceIn {
      @location(0) model_matrix_0: vec4f,
      @location(1) model_matrix_1: vec4f,
      @location(2) model_matrix_2: vec4f,
      @location(3) model_matrix_3: vec4f,
      @location(4) normal_matrix_0: vec4f,
      @location(5) normal_matrix_1: vec4f,
      @location(6) normal_matrix_2: vec4f,
      @location(7) normal_matrix_3: vec4f,
    }
    struct VertexIn {
      ${getVertexInput(layout)}
    }
    struct VertexLayout {
      position: vec3f,
      normal: vec3f,
      tangent: vec3f,
      uv: vec2f,
      color: vec4f,
    }

    fn transformVertex(vertex: VertexIn) -> VertexLayout {
      var result = VertexLayout();
      ${getVertexTransformer(layout)}
      return result;
    }
  `;
}