
export const BASIC_SHADER = `
struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f
}

@vertex
fn vertex_main(instance: InstanceIn, vertexIn: VertexIn) -> VertexOut {
  var output: VertexOut;
  var vertex = transformVertex(vertexIn);
  output.position = vec4f(vertex.position, 1.0);
  output.color = vertex.color;
  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
  return fragData.color;
}
`
