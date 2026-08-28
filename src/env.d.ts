/// <reference types="astro/client" />

declare module "world-atlas/countries-110m.json" {
  const topology: Record<string, any>;
  export default topology;
}

declare module "./scripts/globe-utils.mjs" {
  export function greatCirclePoints(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
    segments?: number,
    radius?: number,
  ): number[][];
  export function latLonToCartesian(latitude: number, longitude: number, radius?: number): number[];
}
