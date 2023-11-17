import { useEffect, useRef, useState } from 'react'
import { Geometry, Material, Renderer, shaders } from './Renderer'
import './App.css'

function App() {
  const animationRequestRef = useRef<number>();
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  
  // Initialize the renderer
  useEffect(() => {
    if (container && renderer === null) {
      Renderer.createRenderer({ container }).then((renderer) => {
        setRenderer(renderer);
        const g1 = new Geometry({
          label: 'Triangle 1',
          renderer,
          vertices: {
            type: 'position-color',
            positions: new Float32Array([
              0, 1, 0,
              0, -1, 0,
              1, -1, 0
            ]),
            colors: new Float32Array([
              1, 0, 0, 1,
              0, 1, 0, 1,
              0, 0, 1, 1
            ])
          }
        });
        const g2 = new Geometry({
          label: 'Triangle 2',
          renderer,
          vertices: {
            type: 'position-color',
            positions: new Float32Array([
              -1, 1, 0,
              -1, -1, 0,
              1, -1, 0,
            ]),
            colors: new Float32Array([
              1, 0, 0, 1,
              0, 1, 0, 1,
              0, 0, 1, 1
            ])
          }
        });
        const material = new Material({
          renderer,
          shaderCode: shaders,
        });
        renderer.add({
          geometry: g1,
          material,
          transforms: [new Float32Array([])]
        });
        renderer.add({
          geometry: g2,
          material,
          transforms: [new Float32Array([])]
        });
      });
    }

    return () => renderer?.dispose();
  }, [container, renderer]);

  // Run main render loop
  useEffect(() => {
    const mainLoop = () => {
      renderer?.render();
      animationRequestRef.current = window.requestAnimationFrame(mainLoop);
    };
    animationRequestRef.current = window.requestAnimationFrame(mainLoop);

    return () => {
      cancelAnimationFrame(animationRequestRef.current!);
    }
  }, [renderer]);

  return (
    <div id="container" ref={setContainer}/>
  )
}

export default App
