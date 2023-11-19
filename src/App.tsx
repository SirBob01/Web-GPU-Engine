import { useEffect, useRef, useState } from 'react'
import { Geometry, Material, Model, Renderer, BASIC_SHADER } from './Renderer'
import './App.css'
import { mat4, vec3 } from 'wgpu-matrix';

const CUBE_POSITIONS = new Float32Array([
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
  0.5, 0.5, -0.5,    -0.5, 0.5, -0.5, -0.5, -0.5, -0.5,

  -0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,     -0.5, 0.5, 0.5,  -0.5, -0.5, 0.5,

  -0.5, 0.5, 0.5,    -0.5, 0.5, -0.5, -0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,

  0.5, 0.5, 0.5,     0.5, 0.5, -0.5,  0.5, -0.5, -0.5,
  0.5, -0.5, -0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5,

  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,
  0.5, -0.5, 0.5,    -0.5, -0.5, 0.5, -0.5, -0.5, -0.5,

  -0.5, 0.5, -0.5,  0.5, 0.5, -0.5,  0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,     -0.5, 0.5, 0.5,  -0.5, 0.5, -0.5
]);
const CUBE_INDICES = [
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
];
const CUBE_TRANSFORM_0 = mat4.translation([-1.5, 0, 6]);
const CUBE_TRANSFORM_1 = mat4.translation([0, 0, 6]);
const CUBE_TRANSFORM_2 = mat4.translation([1.5, 0, 6]);
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
            type: 'position',
            positions: CUBE_POSITIONS,
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
      mat4.rotateX(CUBE_TRANSFORM_1, Math.PI / 180, CUBE_TRANSFORM_1);
      cube?.transform(CUBE_TRANSFORM_1, 1);
      mat4.rotateX(CUBE_TRANSFORM_2, Math.PI / 180, CUBE_TRANSFORM_2);
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
