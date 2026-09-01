import type { ImageMetadata } from "astro";
import { isPhotoTripPublished, publishedPhotoTripSlugs } from "./publication.mjs";

export interface TravelPhoto {
  id: string;
  src: ImageMetadata;
  width: number;
  height: number;
  alt: string;
  caption: string;
  location?: string;
  featured?: boolean;
}

// Originals go in the gitignored incoming/ directory. Add only processed,
// metadata-free derivatives here after captions and alt text are authored, and
// key them by trip slug so a gallery fills in without touching the template.
export const tripPhotos: Readonly<Record<string, readonly TravelPhoto[]>> = {
  "norway-2026": [],
  "france-2026": [],
  "spain-2025": [],
  "spain-2014": [],
};

for (const slug of publishedPhotoTripSlugs) {
  if (!(slug in tripPhotos)) throw new Error(`Published photo trip is unknown: ${slug}`);
  if (tripPhotos[slug].length === 0) throw new Error(`Published photo trip has no photographs: ${slug}`);
}

export function photosForTrip(slug: string): readonly TravelPhoto[] {
  return isPhotoTripPublished(slug) ? (tripPhotos[slug] ?? []) : [];
}

export function hasPublishedPhotos(slug: string): boolean {
  return photosForTrip(slug).length > 0;
}
