import type { ImageMetadata } from "astro";
import sideTable from "../assets/images/woodworking/01-side-table.webp";
import shoeRack from "../assets/images/woodworking/02-shoe-rack.webp";
import desk from "../assets/images/woodworking/03-desk.webp";
import coffeeTable from "../assets/images/woodworking/04-coffee-table.webp";

// Import photographs from ../assets/images/ and set image + a descriptive alt.
// Empty titles intentionally stay neutral until Sean supplies project details.
interface Piece {
  id: string;
  title?: string;
  image?: ImageMetadata;
  alt?: string;
  caption?: string;
}
export const woodworking: Piece[] = [
  {
    id: "wood-01",
    title: "Side table",
    image: sideTable,
    alt: "Dark wooden side-table frame with slatted supports and metal pipe legs, photographed outdoors.",
  },
  {
    id: "wood-02",
    title: "Shoe rack",
    image: shoeRack,
    alt: "Tall wooden shoe rack with open shelves and visible interlocking joints along its uprights.",
  },
  {
    id: "wood-03",
    title: "Desk",
    image: desk,
    alt: "Wooden desk with a broad reddish-brown top, rectangular legs, and dark X-shaped bracing underneath.",
  },
  {
    id: "wood-04",
    title: "Coffee table",
    image: coffeeTable,
    alt: "Wooden coffee table with a glass inset top and a slatted lower shelf, photographed outdoors.",
  },
];
export const artworks: (Piece & { frame: string })[] = [
  { id: "art-01", frame: "walnut portrait" },
  { id: "art-02", frame: "oak landscape" },
  { id: "art-03", frame: "charcoal portrait" },
  { id: "art-04", frame: "oak square" },
  { id: "art-05", frame: "walnut square" },
  { id: "art-06", frame: "oak landscape" },
  { id: "art-07", frame: "walnut landscape" },
];
export const eagle: Piece = { id: "eagle-ramp" };
