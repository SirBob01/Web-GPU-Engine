/**
 * Round up a value to the nearest alignment.
 *
 * @param value 
 * @param alignment 
 * @returns 
 */
export function align(value: number, alignment = 4) {
    return Math.ceil(value / alignment) * alignment;
}