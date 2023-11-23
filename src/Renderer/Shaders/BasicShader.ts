
export const BASIC_SHADER = `
struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) world_position: vec4f,
  @location(1) world_normal: vec3f,
  @location(2) color: vec4f,
}

@vertex
fn vertex_main(instance: InstanceIn, vertexIn: VertexIn) -> VertexOut {
  let model_matrix = mat4x4<f32>(
    instance.model_matrix_0,
    instance.model_matrix_1,
    instance.model_matrix_2,
    instance.model_matrix_3
  );
  let normal_matrix = mat4x4<f32>(
    instance.normal_matrix_0,
    instance.normal_matrix_1,
    instance.normal_matrix_2,
    instance.normal_matrix_3
  );
  let vertex = transformVertex(vertexIn);


  var output: VertexOut;
  output.world_position = model_matrix * vec4f(vertex.position, 1);
  output.world_normal = (normal_matrix * vec4(vertex.normal, 1)).xyz;
  output.position = camera * output.world_position;
  output.color = vertex.color;
  return output;
}

@fragment
fn fragment_main(fragIn: VertexOut) -> @location(0) vec4f {
  let light_position = vec3f(3, 0, 3);
  let light_direction = normalize(light_position - fragIn.world_position.xyz);
  let light_color = vec3f(1, 1, 1);

  let diffuse_strength = max(dot(fragIn.world_normal, light_direction), 0.0);
  let diffuse = diffuse_strength * light_color;

  let ambient = vec3f(0.1, 0.1, 0.1);

  let result = vec4f((ambient + diffuse) * fragIn.color.xyz, 1);
  return result;
}
`
