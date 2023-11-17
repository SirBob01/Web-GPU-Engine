import { Material, Model, VERTEX_BUFFER_LAYOUTS, VertexLayout } from "./Core";

/**
 * Renderer configuration.
 */
interface RendererDesc {
  canvas: HTMLCanvasElement;
}

/**
 * WebGPU based renderer.
 */
export class Renderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly device: GPUDevice;
  public readonly context: GPUCanvasContext;

  private models: Set<Model> = new Set();
  private pipelineGroups: Map<number, Record<VertexLayout['type'], GPURenderPipeline>> = new Map();
  
  private constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.canvas = canvas;
    this.device = device;
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;
    this.context.configure({
      device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied"
    });
  }

  private createPipelineGroup(material: Material) {
    const pipelineGroup = new Map<VertexLayout['type'], GPURenderPipeline>()
    for (const layoutType in VERTEX_BUFFER_LAYOUTS) {
      const layout = VERTEX_BUFFER_LAYOUTS[layoutType as VertexLayout['type']];
      const pipeline = this.device.createRenderPipeline({
        vertex: {
          module: material.shader,
          entryPoint: "vertex_main",
          buffers: [layout],
        },
        fragment: {
          module: material.shader,
          entryPoint: "fragment_main",
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat(),
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
        },
        layout: "auto"
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

    return new Renderer(config.canvas, device);
  }

  /**
   * Add a model to draw.
   *
   * @param model
   */
  add(model: Model) {
    this.models.add(model);
  }

  /**
   * Stop drawing a model.
   *
   * @param model
   */
  remove(model: Model) {
    this.models.delete(model);
  }

  /**
   * Render a frame.
   */
  render() {
    const commandEncoder = this.device.createCommandEncoder();
    const renderpass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 1, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    });
  
    for (const model of this.models) {
      const pipelineGroup = this.getPipelineGroup(model.material);
      const pipeline = pipelineGroup[model.geometry.layout];

      renderpass.setPipeline(pipeline);
      renderpass.setVertexBuffer(0, model.geometry.vertices);
      renderpass.setIndexBuffer(model.geometry.indices, model.geometry.indexFormat);
      renderpass.draw(model.geometry.count, model.transforms.length, 0, 0);
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
  }
}