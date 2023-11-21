import { getVertexShaderInput } from "./Shaders";
import { Camera, Color, INSTANCE_BUFFER_LAYOUT, Material, Model, Uniform, VERTEX_BUFFER_LAYOUTS, VertexLayout } from "./Core";

/**
 * Renderer configuration.
 */
interface RendererDesc {
  container: HTMLElement;
}

/**
 * WebGPU based renderer.
 */
export class Renderer {
  readonly device: GPUDevice;
  readonly canvas: HTMLCanvasElement;
  readonly context: GPUCanvasContext;
  readonly models: Set<Model> = new Set();
  
  readonly clearColor: Color;
  readonly camera: Camera;

  private cameraUniform: Uniform;
  private uniformBindGroupLayout: GPUBindGroupLayout;
  private pipelineLayout: GPUPipelineLayout;
  private cameraBindGroup: GPUBindGroup;

  private shaderCache: Map<string, Record<VertexLayout['type'], GPUShaderModule>> = new Map();
  private pipelineGroups: Map<number, Record<VertexLayout['type'], GPURenderPipeline>> = new Map(); 

  private resizeObserver: ResizeObserver;

  private constructor(container: HTMLElement, device: GPUDevice) {
    this.device = device;

    this.canvas = document.createElement("canvas");
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    container.appendChild(this.canvas);

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.context.configure({
      device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied"
    });

    this.clearColor = new Color();
    this.camera = new Camera();
    this.cameraUniform = new Uniform({
      renderer: this,
      label: "Camera",
      size: 64,
    });

    // TODO: Better abstraction?
    this.uniformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ],
    });
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.uniformBindGroupLayout,
      ],
    });
    this.cameraBindGroup = this.device.createBindGroup({
      layout: this.uniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.cameraUniform.buffer,
          },
        },
      ],
    });

    
    // Listen for canvas resizing to update the camera aspect ratio
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          this.canvas.width = contentBoxSize.inlineSize;
          this.canvas.height = contentBoxSize.blockSize;
          this.camera.aspect = this.canvas.width / this.canvas.height;
        }
      }
    });
    this.resizeObserver.observe(container);
  }

  private createPipelineGroup(material: Material) {
    const pipelineGroup = new Map<VertexLayout['type'], GPURenderPipeline>()
    for (const layoutType in VERTEX_BUFFER_LAYOUTS) {
      const pipeline = this.device.createRenderPipeline({
        vertex: {
          module: material.shaderModules[layoutType as VertexLayout['type']],
          entryPoint: "vertex_main",
          buffers: [
            INSTANCE_BUFFER_LAYOUT,
            VERTEX_BUFFER_LAYOUTS[layoutType as VertexLayout['type']],
          ],
        },
        fragment: {
          module: material.shaderModules[layoutType as VertexLayout['type']],
          entryPoint: "fragment_main",
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat(),
            },
          ],
        },
        primitive: {
          cullMode: material.culling,
          topology: material.toplogy,
          frontFace: material.winding,
        },
        layout: this.pipelineLayout
      });
      pipelineGroup.set(layoutType as VertexLayout['type'], pipeline);
    }
    return Object.fromEntries(pipelineGroup.entries()) as Record<VertexLayout['type'], GPURenderPipeline>;
  }

  private getPipelineGroup(material: Material) {
    let pipelineGroup = this.pipelineGroups.get(material.id);
    if (!pipelineGroup) {
      pipelineGroup = this.createPipelineGroup(material);
      this.pipelineGroups.set(material.id, pipelineGroup);
    }
    return pipelineGroup;
  }

  /**
   * Create a new renderer.
   *
   * @param config
   * @returns 
   */
  static async createRenderer(config: RendererDesc) {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported on this device.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Failed to find an appropriate GPU adapter.");
    }

    const device = await adapter.requestDevice();
    if (!device) {
      throw new Error("Failed to create GPU device.");
    }

    return new Renderer(config.container, device);
  }

  /**
   * Get the shader modules corresponding to the shader code.
   *
   * @param code
   * @returns 
   */
  getShaderModules(code: string) {
    let record = this.shaderCache.get(code);
    if (!record) {
      record = {} as Record<string, GPUShaderModule>;
      for (const key in VERTEX_BUFFER_LAYOUTS) {
        const layout = key as VertexLayout['type'];
        const input = getVertexShaderInput(layout);
        const shaderCode = `
          ${input}
          ${code}
        `;
        record[layout] = this.device.createShaderModule({
          label: `ShaderModule(${layout} - ${code})`,
          code: shaderCode,
        });
      }
      this.shaderCache.set(code, record);
    }
    return record;
  }

  /**
   * Render a frame.
   */
  render() {
    // Camera to uniform buffer
    this.cameraUniform.write(new Float32Array(this.camera.matrix));
    // TODO: Is it slow to create this on the fly?


    // Setup the command queue and renderpass
    const commandEncoder = this.device.createCommandEncoder();
    const renderpass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: [this.clearColor.r, this.clearColor.g, this.clearColor.b, 1],
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    });
  
    // Render the models
    for (const model of this.models) {
      const pipelineGroup = this.getPipelineGroup(model.material);
      const pipeline = pipelineGroup[model.geometry.layout];

      renderpass.setPipeline(pipeline);
      renderpass.setBindGroup(0, this.cameraBindGroup);
      renderpass.setVertexBuffer(0, model.instances);
      renderpass.setVertexBuffer(1, model.geometry.vertices);
      if (model.geometry.indices) {
        renderpass.setIndexBuffer(model.geometry.indices, model.geometry.indexFormat);
        renderpass.drawIndexed(
          model.geometry.indexCount,
          model.instanceCount,
        );
      } else {
        renderpass.draw(model.geometry.vertexCount, model.instanceCount);
      }
    }

    renderpass.end();
    const commandBuffer = commandEncoder.finish();
    this.device.queue.submit([commandBuffer]);
  }

  /**
   * Dispose all GPU resources allocated by the renderer.
   */
  dispose() {
    this.context.unconfigure();
    this.device.destroy();
    this.resizeObserver.disconnect();
  }
}