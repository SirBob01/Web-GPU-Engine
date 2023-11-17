import { Geometry } from "./Geometry";
import { Material } from "./Material";

/**
 * A model is a combination of a geometry, a material, and a set of transforms (for instanced models).
 */
export interface Model {
  geometry: Geometry;
  material: Material;
  transforms: Float32Array[];
}
