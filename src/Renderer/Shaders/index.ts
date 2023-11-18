export const shaders = `
struct InstanceIn {
  @location(0) model_matrix_0 : vec4f,
  @location(1) model_matrix_1 : vec4f,
  @location(2) model_matrix_2 : vec4f,
  @location(3) model_matrix_3 : vec4f
}
struct VertexIn {
  @location(4) position : vec3f,
  @location(5) color : vec4f
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

@vertex
fn vertex_main(instance: InstanceIn, vertex: VertexIn) -> VertexOut
{
  var output : VertexOut;
  output.position = vec4f(vertex.position, 1.0);
  output.color = vertex.color;
  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}
`;
