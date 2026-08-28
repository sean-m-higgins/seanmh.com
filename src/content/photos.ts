import type { ImageMetadata } from "astro";

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
// metadata-free derivatives here after captions and alt text are authored.
export const norwayPhotos: readonly TravelPhoto[] = [];
