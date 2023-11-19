/**
 * Color class.
 */
export class Color {
  r: number;
  g: number;
  b: number;

  constructor(r = 0, g = 0, b = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  /**
   * Copy the contents of color to this.
   *
   * @param color
   */
  copy(color: Color) {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
  }

  /**
   * Convert the color to an array.
   *
   * @returns
   */
  toArray(): [number, number, number] {
    return [this.r, this.g, this.b];
  }

  /**
   * Convert the color to a hex value.
   */
  toHex(): number {
    const r = Math.round(this.r * 255);
    const g = Math.round(this.g * 255);
    const b = Math.round(this.b * 255);
    return (r << 16) + (g << 8) + b;
  }

  /**
   * Convert the color to a hex string.
   *
   * @returns
   */
  toHexString(): string {
    return this.toHex().toString(16);
  }

  /**
   * Set from a hex value.
   *
   * @param hex
   */
  setFromHex(hex: number) {
    this.r = ((hex >> 16) & 0xff) / 255;
    this.g = ((hex >> 8) & 0xff) / 255;
    this.b = (hex & 0xff) / 255;
    return this;
  }

  /**
   * Set from a hex string.
   *
   * @param hex
   */
  setFromHexString(hex: string) {
    return this.setFromHex(parseInt(hex, 16));
  }
}