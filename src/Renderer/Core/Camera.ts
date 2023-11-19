import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix";

/**
 * 3D perspective camera
 */
export class Camera {
  private view: Mat4;
  private projection: Mat4;
  private cameraMatrix: Mat4;

  eye: Vec3;
  target: Vec3;
  up: Vec3;
  
  fovy: number;
  aspect: number;
  near: number;
  far: number;

  constructor() {
    this.view = mat4.create();
    this.projection = mat4.create();
    this.cameraMatrix = mat4.create();

    this.eye = vec3.create();
    this.target = vec3.create(0, 0, 1);
    this.up = vec3.create(0, 1, 0);

    this.fovy = Math.PI / 4;
    this.aspect = 1;
    this.near = 0.1;
    this.far = 100;
  }

  get matrix(): Mat4 {
    mat4.lookAt(this.eye, this.target, this.up, this.view);
    mat4.perspective(
      this.fovy,
      this.aspect,
      this.near,
      this.far,
      this.projection
    );
    
    return mat4.multiply(this.projection, this.view, this.cameraMatrix);
  }
}