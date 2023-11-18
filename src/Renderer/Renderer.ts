import { getVertexShaderInput } from ".";
import { Color, INSTANCE_BUFFER_LAYOUT, Material, Model, VERTEX_BUFFER_LAYOUTS, VertexLayout } from "./Core";

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
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly clearColor: Color;
  readonly models: Set<Model> = new Set();

  private shaderCache: Map<string, Record<VertexLayout['type'], GPUShaderModule>> = new Map();
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

    this.clearColor = new Color();
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

    // Create the canvas
    const canvas = document.createElement("canvas");
    canvas.width = config.container.clientWidth;
    canvas.height = config.container.clientHeight;
    config.container.appendChild(canvas);

    // Resize the canvas to fit the container
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0];
          canvas.width = contentBoxSize.inlineSize;
          canvas.height = contentBoxSize.blockSize;
        }
      }
    });
    resizeObserver.observe(config.container);

    return new Renderer(canvas, device);
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
  
    for (const model of this.models) {
      const pipelineGroup = this.getPipelineGroup(model.material);
      const pipeline = pipelineGroup[model.geometry.layout];

      renderpass.setPipeline(pipeline);
      renderpass.setVertexBuffer(0, model.instances);
      renderpass.setVertexBuffer(1, model.geometry.vertices);
      renderpass.setIndexBuffer(model.geometry.indices, model.geometry.indexFormat);
      renderpass.drawIndexed(
        model.geometry.indexCount,
        model.instanceCount,
        0,
        0,
        0,
      );
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