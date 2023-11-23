import { useEffect, useRef, useState } from 'react'
import { Geometry, Material, Model, Renderer, BASIC_SHADER } from './Renderer'
import './App.css'
import { mat4, vec3 } from 'wgpu-matrix';

const CUBE_POSITIONS = new Float32Array([
  // top (0, 0, 1)
  -1, -1, 1,
  1, -1, 1,
  1, 1, 1,
  -1, 1, 1,
  // bottom (0, 0, -1)
  -1, 1, -1,
  1, 1, -1,
  1, -1, -1,
  -1, -1, -1,
  // right (1, 0, 0)
  1, -1, -1,
  1, 1, -1,
  1, 1, 1,
  1, -1, 1,
  // left (-1, 0, 0)
  -1, -1, 1,
  -1, 1, 1,
  -1, 1, -1,
  -1, -1, -1,
  // front (0, 1, 0)
  1, 1, -1,
  -1, 1, -1,
  -1, 1, 1,
  1, 1, 1,
  // back (0, -1, 0)
  1, -1, 1,
  -1, -1, 1,
  -1, -1, -1,
  1, -1, -1,
]);
const CUBE_NORMALS = new Float32Array([
  // top (0, 0, 1)
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  // bottom (0, 0, -1)
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  0, 0, -1,
  // right (1, 0, 0)
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  // left (-1, 0, 0)
  -1, 0, 0,
  -1, 0, 0,
  -1, 0, 0,
  -1, 0, 0,
  // front (0, 1, 0)
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  // back (0, -1, 0)
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
  0, -1, 0,
]);
const CUBE_COLORS = new Float32Array([
  // top (0, 0, 1)
  -1, -1, 1, 1,
  1, -1, 1, 1,
  1, 1, 1, 1,
  -1, 1, 1, 1,
  // bottom (0, 0, -1)
  -1, 1, -1, 1,
  1, 1, -1, 1,
  1, -1, -1, 1,
  -1, -1, -1, 1,
  // right (1, 0, 0)
  1, -1, -1, 1,
  1, 1, -1, 1,
  1, 1, 1, 1,
  1, -1, 1, 1,
  // left (-1, 0, 0)
  -1, -1, 1, 1,
  -1, 1, 1, 1,
  -1, 1, -1, 1,
  -1, -1, -1, 1,
  // front (0, 1, 0)
  1, 1, -1, 1,
  -1, 1, -1, 1,
  -1, 1, 1, 1,
  1, 1, 1, 1,
  // back (0, -1, 0)
  1, -1, 1, 1,
  -1, -1, 1, 1,
  -1, -1, -1, 1,
  1, -1, -1, 1,
]);
const CUBE_INDICES = [
  0, 1, 2, 2, 3, 0, // top
  4, 5, 6, 6, 7, 4, // bottom
  8, 9, 10, 10, 11, 8, // right
  12, 13, 14, 14, 15, 12, // left
  16, 17, 18, 18, 19, 16, // front
  20, 21, 22, 22, 23, 20, // back
]
const CUBE_TRANSFORM_0 = mat4.translation([-3, 0, 6]);
const CUBE_TRANSFORM_1 = mat4.translation([0, 0, 6]);
const CUBE_TRANSFORM_2 = mat4.translation([3, 0, 6]);
const KEYSTATE = new Set<string>();

function App() {
  const animationRequestRef = useRef<number>();
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [cube, setCube] = useState<Model | null>(null);

  // Initialize the renderer
  useEffect(() => {
    if (container && renderer === null) {
      Renderer.createRenderer({ container }).then((renderer) => {
        setRenderer(renderer);
        const cubeGeometry = new Geometry({
          label: 'Cube 1',
          renderer,
          vertices: {
            type: 'position-normal-color',
            positions: CUBE_POSITIONS,
            colors: CUBE_COLORS,
            normals: CUBE_NORMALS
          },
          indices: CUBE_INDICES,
        });
        const material = new Material({
          renderer,
          shaderCode: BASIC_SHADER,
          uniforms: {},
        });
        const cube = new Model({
          renderer,
          label: 'Cube 1',
          geometry: cubeGeometry,
          material,
          instanceCount: 3,
        });
        setCube(cube);

        renderer.models.add(cube);
        renderer.clearColor.setFromHex(0xAA00AA);
      });
    }

    return () => renderer?.dispose();
  }, [container, renderer]);

  // Run main render loop
  useEffect(() => {
    const mainLoop = () => {
      mat4.rotateX(CUBE_TRANSFORM_0, Math.PI / 180, CUBE_TRANSFORM_0);
      cube?.transform(CUBE_TRANSFORM_0, 0);
      mat4.rotateY(CUBE_TRANSFORM_1, Math.PI / 180, CUBE_TRANSFORM_1);
      cube?.transform(CUBE_TRANSFORM_1, 1);
      mat4.rotateZ(CUBE_TRANSFORM_2, Math.PI / 180, CUBE_TRANSFORM_2);
      cube?.transform(CUBE_TRANSFORM_2, 2);

      if (KEYSTATE.has('a')) {
        vec3.add(renderer!.camera.eye, [-0.01, 0, 0], renderer!.camera.eye);
      }
      if (KEYSTATE.has('d')) {
        vec3.add(renderer!.camera.eye, [0.01, 0, 0], renderer!.camera.eye);
      }
      if (KEYSTATE.has('s')) {
        vec3.add(renderer!.camera.eye, [0, 0, -0.01], renderer!.camera.eye);
      }
      if (KEYSTATE.has('w')) {
        vec3.add(renderer!.camera.eye, [0, 0, 0.01], renderer!.camera.eye);
      }
      if (KEYSTATE.has('q')) {
        vec3.add(renderer!.camera.eye, [0, -0.01, 0], renderer!.camera.eye);
      }
      if (KEYSTATE.has('e')) {
        vec3.add(renderer!.camera.eye, [0, 0.01, 0], renderer!.camera.eye);
      }

      renderer?.render();
      animationRequestRef.current = window.requestAnimationFrame(mainLoop);
    };
    animationRequestRef.current = window.requestAnimationFrame(mainLoop);

    return () => {
      cancelAnimationFrame(animationRequestRef.current!);
    }
  }, [cube, renderer]);

  // Attach event handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      KEYSTATE.add(e.key);
    }
    const onKeyUp = (e: KeyboardEvent) => {
      KEYSTATE.delete(e.key);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    }
  }, []);

  return (
    <div id="container" ref={setContainer}/>
  )
}

export default App
