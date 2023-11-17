import { Renderer } from '../Renderer';

export interface TextureDescriptor {
  renderer: Renderer;
  label: string;
  source?: Uint8ClampedArray;
  width: number;
  height: number;
  format: GPUTextureFormat;
  addressModeU: GPUAddressMode;
  addressModeV: GPUAddressMode;
  magFilter: GPUFilterMode;
}

/**
 * GPU allocated 2D texture.
 */
export class Texture {
  readonly resource: GPUTexture;
  readonly addressModeU: GPUAddressMode;
  readonly addressModeV: GPUAddressMode;
  readonly magFilter: GPUFilterMode;

  constructor(descriptor: TextureDescriptor) {
    this.resource = descriptor.renderer.device.createTexture({
      label: descriptor.label,
      size: [descriptor.width, descriptor.height],
      format: descriptor.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.addressModeU = descriptor.addressModeU;
    this.addressModeV = descriptor.addressModeV;
    this.magFilter = descriptor.magFilter;

    if (descriptor.source) {
      descriptor.renderer.device.queue.writeTexture(
        { texture: this.resource },
        descriptor.source,
        { bytesPerRow: descriptor.width * 4 },
        { width: descriptor.width, height: descriptor.height },
      );
    }
  }

  /**
   * Load a texture from an image.
   *
   * @param renderer
   * @param imageURL
   * @returns 
   */
  async loadImage(renderer: Renderer, imageURL: string) {
    const response = await fetch(imageURL);
    const blob = await response.blob();
    const source = await createImageBitmap(blob);

    const size = [source.width, source.height];
    const texture = new Texture({
      renderer,
      label: `Texture(${imageURL})`,
      width: source.width,
      height: source.height,
      format: 'rgba8unorm',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'nearest',
    });
    renderer.device.queue.copyExternalImageToTexture({ source }, { texture: texture.resource }, size);
    return texture;
  }

  /**
   * Dispose of the texture.
   */
  dispose() {
    this.resource.destroy();
  }
}