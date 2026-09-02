import type { ImageMetadata } from "astro";
import { isPhotoTripPublished, publishedPhotoTripSlugs } from "./publication.mjs";

import no01 from "../assets/trips/norway-2026/01-1img-5826.jpg";
import no02 from "../assets/trips/norway-2026/02-2img-5833.jpg";
import no03 from "../assets/trips/norway-2026/03-3img-5891.jpg";
import no04 from "../assets/trips/norway-2026/04-4img-5905.jpg";
import no05 from "../assets/trips/norway-2026/05-5img-5899.jpg";
import no06 from "../assets/trips/norway-2026/06-6img-5924.jpg";
import no07 from "../assets/trips/norway-2026/07-7img-5885.jpg";
import no08 from "../assets/trips/norway-2026/08-8img-5888.jpg";
import no09 from "../assets/trips/norway-2026/09-9img-5926.jpg";
import no10 from "../assets/trips/norway-2026/10-10img-6134.jpg";
import no11 from "../assets/trips/norway-2026/11-11img-6294.jpg";
import no12 from "../assets/trips/norway-2026/12-12img-6307.jpg";
import no13 from "../assets/trips/norway-2026/13-13img-6306.jpg";
import no14 from "../assets/trips/norway-2026/14-14img-6132.jpg";
import no15 from "../assets/trips/norway-2026/15-15img-6316.jpg";
import no16 from "../assets/trips/norway-2026/16-16img-6338.jpg";
import no17 from "../assets/trips/norway-2026/17-17img-6389.jpg";
import no18 from "../assets/trips/norway-2026/18-18img-6352.jpg";
import no19 from "../assets/trips/norway-2026/19-19img-6332.jpg";
import no20 from "../assets/trips/norway-2026/20-20img-6414.jpg";
import no21 from "../assets/trips/norway-2026/21-21img-6139.jpg";
import no22 from "../assets/trips/norway-2026/22-22img-6087.jpg";
import no23 from "../assets/trips/norway-2026/23-23img-6090.jpg";
import no24 from "../assets/trips/norway-2026/24-24img-6502.jpg";
import no25 from "../assets/trips/norway-2026/25-25img-6498.jpg";

import fr01 from "../assets/trips/france-2026/01-1img-1868.jpg";
import fr02 from "../assets/trips/france-2026/02-2img-1900.jpg";
import fr03 from "../assets/trips/france-2026/03-3img-1892.jpg";
import fr04 from "../assets/trips/france-2026/04-4img-1915.jpg";
import fr05 from "../assets/trips/france-2026/05-5img-1930.jpg";
import fr06 from "../assets/trips/france-2026/06-6img-1935.jpg";
import fr07 from "../assets/trips/france-2026/07-7img-1946.jpg";
import fr08 from "../assets/trips/france-2026/08-8img-2174.jpg";
import fr09 from "../assets/trips/france-2026/09-9img-2193.jpg";
import fr10 from "../assets/trips/france-2026/10-10img-2272.jpg";
import fr11 from "../assets/trips/france-2026/11-11img-2613.jpg";
import fr12 from "../assets/trips/france-2026/12-12img-2612.jpg";
import fr13 from "../assets/trips/france-2026/13-13img-2729.jpg";
import fr14 from "../assets/trips/france-2026/14-14img-3197.jpg";
import fr15 from "../assets/trips/france-2026/15-15img-3200.jpg";
import fr16 from "../assets/trips/france-2026/16-16img-3201.jpg";
import fr17 from "../assets/trips/france-2026/17-17img-3205.jpg";
import fr18 from "../assets/trips/france-2026/18-18img-3215.jpg";
import fr19 from "../assets/trips/france-2026/19-19img-3222.jpg";
import fr20 from "../assets/trips/france-2026/20-20img-3223.jpg";
import fr21 from "../assets/trips/france-2026/21-21img-3377.jpg";
import fr22 from "../assets/trips/france-2026/22-22img-3528.jpg";
import fr23 from "../assets/trips/france-2026/23-23img-3412.jpg";
import fr24 from "../assets/trips/france-2026/24-24img-3499.jpg";
import fr25 from "../assets/trips/france-2026/25-25img-3524.jpg";

import es01 from "../assets/trips/spain-2025/01-1img-1199.jpg";
import es02 from "../assets/trips/spain-2025/02-2img-1640.jpg";
import es03 from "../assets/trips/spain-2025/03-3img-1509.jpg";
import es04 from "../assets/trips/spain-2025/04-4img-1516.jpg";
import es05 from "../assets/trips/spain-2025/05-5img-1521.jpg";
import es06 from "../assets/trips/spain-2025/06-6img-1433.jpg";
import es07 from "../assets/trips/spain-2025/07-7img-1337.jpg";
import es08 from "../assets/trips/spain-2025/08-8img-1542.jpg";
import es09 from "../assets/trips/spain-2025/09-9img-1543.jpg";
import es10 from "../assets/trips/spain-2025/10-10img-1656.jpg";
import es11 from "../assets/trips/spain-2025/11-11img-1734.jpg";
import es12 from "../assets/trips/spain-2025/12-12img-1694.jpg";
import es13 from "../assets/trips/spain-2025/13-13img-1752.jpg";

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

/** Dimensions always come from the import, so they cannot drift from the file. */
function frame(
  id: string,
  src: ImageMetadata,
  alt: string,
  caption: string,
  location?: string,
): TravelPhoto {
  return { id, src, width: src.width, height: src.height, alt, caption, location };
}

// Originals go in the gitignored incoming/ directory. Add only processed,
// metadata-free derivatives here after captions and alt text are authored, and
// key them by trip slug so a gallery fills in without touching the template.
export const tripPhotos: Readonly<Record<string, readonly TravelPhoto[]>> = {
  "norway-2026": [
    frame("oslo-timber", no01,
      "A three-storey building clad in weathered vertical timber, wild grasses growing at its base under a blue sky",
      "Silvered timber, left to weather rather than repainted.", "Oslo"),
    frame("oslo-suspended", no02,
      "Dark figurative sculptures suspended above a glass entrance, with a large pale stone form standing on the pavement below",
      "Sculpture hung overhead, so you walk in underneath it.", "Oslo"),
    frame("oslo-rainbow", no03,
      "A rainbow arcing over a park of mown grass with pale apartment blocks and trees behind",
      "A rainbow over the park, gone before the walk back.", "Oslo"),
    frame("oslo-terrace", no04,
      "A waterside restaurant terrace with patio heaters and folded umbrellas, looking across the harbour to apartment blocks and a kayaker",
      "Heaters on the terrace in August, which tells you enough.", "Oslo"),
    frame("oslo-canal", no05,
      "A narrow canal between apartment blocks, crossed by timber footbridges and decks that reflect in the still water",
      "The water runs between the blocks and everyone gets a bridge.", "Oslo"),
    frame("oslo-dusk-harbour", no06,
      "Waterfront apartment buildings across flat calm water under a pale evening sky",
      "Low sun on the far bank, the harbour gone completely flat.", "Oslo"),
    frame("oslo-glass-diagonal", no07,
      "A glass office tower photographed from below, its facade folding into diagonal reflections of sky and cloud",
      "The whole facade is a diagonal, and it reflects one.", "Oslo"),
    frame("oslo-towers", no08,
      "Two tall residential towers with stacked balconies rising over a wet street with trees and shopfronts",
      "Rain earlier, judging by the street.", "Oslo"),
    frame("glass-wreck", no09,
      "An angular glass-and-steel structure tilted in shallow coastal water at dusk, a low island behind it and a pink sky above",
      "Tilted in the shallows, deliberately, like something run aground."),
    frame("vestfjorden-cloud", no10,
      "A steep headland with cloud pouring over its ridge, dark sea in the foreground",
      "Cloud coming over the ridge faster than the ferry moved.", "Vestfjorden"),
    frame("village-under-peak", no11,
      "A sharp granite peak streaked with green rising above a shoreline village of white houses and moored boats",
      "The mountain does not step back from the village at all.", "Lofoten"),
    frame("clifftop-road", no12,
      "A narrow road curving along a green clifftop above the sea, seen from a rough trail above",
      "The road takes the only line the cliff allows.", "Lofoten"),
    frame("summit-figure", no13,
      "A rocky summit ridge dropping away to blue sea far below, with a single figure in a red jacket sitting near the top",
      "Someone in red at the top, for scale.", "Lofoten"),
    frame("ridge-in-cloud", no14,
      "A green and grey mountain ridge with cloud sitting on the rock above it",
      "The cloud sat on the ridge all afternoon and did not lift.", "Lofoten"),
    frame("fjord-from-above", no15,
      "A high view down a long fjord between steep mountains, the far end lost in low cloud",
      "The fjord runs out of sight before the mountains do.", "Lofoten"),
    frame("bridge-and-wake", no16,
      "A low bridge linking rocky islets across deep blue water, a boat drawing a white wake beneath it",
      "One bridge, two islands, and the only road there is.", "Lofoten"),
    frame("wall-into-fjord", no17,
      "A steep mountain wall dropping straight into a deep blue fjord, its summit covered by cloud",
      "It goes into the water at the same angle it left the sky.", "Lofoten"),
    frame("village-from-air", no18,
      "A village of red timber cabins and a small marina on a green headland, seen from high above, with a boat wake crossing the pale water",
      "Red cabins, a harbour, and not much level ground.", "Lofoten"),
    frame("pitch-by-the-sea", no19,
      "A full-size green football pitch wedged between houses and the shoreline, seen from the ridge above",
      "They found the one flat rectangle on the island and used it.", "Lofoten"),
    frame("reine-panorama", no20,
      "A wide view of a village spread along the water beneath a horizon of jagged grey peaks under heavy cloud",
      "The whole village, and the whole ridge behind it, in one look.", "Reine"),
    frame("bridge-to-hillside", no21,
      "A long low concrete bridge curving toward a green hillside with cloud resting on its summit",
      "The bridge lands on the only green slope in the frame.", "Lofoten"),
    frame("rorbu-blue-hour", no22,
      "Dark timber cabins on stilts over water at blue hour, their windows lit warm against a silhouetted mountain",
      "Blue hour lasts a long time this far north.", "Lofoten"),
    frame("peak-reflected", no23,
      "A large dark peak mirrored almost perfectly in still black water at blue hour, small lights along the shore beneath it",
      "No wind at all, so the mountain came twice.", "Lofoten"),
    frame("cloud-on-water", no24,
      "Low cloud sitting directly on dark open sea, a faint dark shore behind it",
      "The cloud came all the way down to the water.", "Vestfjorden"),
    frame("drying-racks", no25,
      "Empty wooden stockfish drying racks silhouetted on a rocky shore, with low sun breaking through cloud and laying gold on the sea",
      "The racks are empty by August. The light is not.", "Lofoten"),
  ],

  "france-2026": [
    frame("tram-and-sky", fr01,
      "A red and black tram passing a white modern apartment building against a deep blue sky",
      "Deep blue sky, and a tram to be somewhere else by."),
    frame("arch-downhill", fr02,
      "A tall stone triumphal arch framing a street that runs downhill between pale buildings toward distant hills, with people crossing beneath",
      "The arch frames the street, and the street frames the hills.", "Marseille"),
    frame("cat-on-the-wall", fr03,
      "An ochre apartment facade with shutters and a washing line, a cat walking along the top of a cracked garden wall below",
      "The cat had the better route.", "Marseille"),
    frame("gallery-two-floors", fr04,
      "The interior of a gallery over two levels, hung with large abstract paintings in blue, red and orange",
      "Two floors, and no wall left empty."),
    frame("passage-de-lorette", fr05,
      "A tiled entrance under a gilded sign reading Passage de Lorette, with a mosaic panel of a city and its harbour above the doorway",
      "The passage puts a map of the city over its own door.", "Marseille"),
    frame("stork-panel", fr06,
      "A mosaic panel of a white stork standing in grass, set into a plain rendered wall beside a young tree",
      "A stork set into the render, facing the street."),
    frame("harbour-mural", fr07,
      "A large sepia mural of an old working harbour with cranes and sailing ships, painted across a wall beneath a blue street sign",
      "The old port, painted on a wall a long way from it."),
    frame("kitchen-counter", fr08,
      "A cook working behind a small restaurant counter, turquoise tiles and hanging pans behind him, a folded cloth over the counter edge",
      "One cook, one counter, one thing at a time."),
    frame("brick-and-crane", fr09,
      "A no-stopping sign in the foreground with a large modern building of patterned brick and a construction crane behind",
      "Still going up behind the sign that says not to stop."),
    frame("aqueduct-boulevard", fr10,
      "A long stone aqueduct running beside a tree-lined boulevard in low sun, its arches throwing repeated shadows across the pavement",
      "The arches keep going long after the road stops caring.", "Montpellier"),
    frame("peaks-at-dusk", fr11,
      "Snow-covered alpine peaks above dark forested slopes, the sky fading pink behind them",
      "The peaks kept the light after the valley lost it."),
    frame("wide-slope", fr12,
      "A broad snow-covered ski slope scattered with pines, a piste running down its flank",
      "A whole face, and one line down it."),
    frame("gondola-overhead", fr13,
      "A gondola cabin marked Alpe d'Huez passing directly overhead, snowy peaks visible beyond it",
      "Everything here arrives hanging from a cable.", "Alpe d'Huez"),
    frame("piste-into-cloud", fr14,
      "A piste running down toward a valley completely filled with cloud, dark rock breaking through above it",
      "The run ends in cloud, and you go anyway.", "Alpe d'Huez"),
    frame("summit-dome", fr15,
      "Wind-blown snow streaming across a broad white summit dome under a dark blue sky, skiers reduced to specks",
      "Wind across the top, and everyone very small.", "Alpe d'Huez"),
    frame("flat-light", fr16,
      "Skiers spread across a wide open snow slope with dark rock outcrops, in flat grey light",
      "Flat light, which flattens the slope with it.", "Alpe d'Huez"),
    frame("orange-netting", fr17,
      "A snow ridge under deep blue sky with a line of orange safety netting staked across it",
      "Orange netting, and a very clear reason for it.", "Alpe d'Huez"),
    frame("station-interior", fr18,
      "The inside of a gondola station, empty cabins parked in a line under steel trusses above a metal grating floor",
      "Where the cabins go when the mountain closes.", "Alpe d'Huez"),
    frame("resort-in-the-bowl", fr19,
      "A resort town spread across a snowy bowl far below, with cloud hanging over the mountain wall behind it",
      "The whole resort fits in the bowl, with room over.", "Alpe d'Huez"),
    frame("mountain-restaurant", fr20,
      "A mountain restaurant terrace built into the piste under low cloud, a single skier passing below it",
      "Lunch at the point where the cloud starts.", "Alpe d'Huez"),
    frame("pebble-beach", fr21,
      "A grey pebble beach meeting turquoise Mediterranean water, a few people lying out on the stones",
      "Pebbles, not sand, and nobody seems to mind.", "Nice"),
    frame("old-town-street", fr22,
      "A street of ochre and pink buildings with shutters and balconies, hills closing off the far end in evening light",
      "The street runs until the hills stop it.", "Nice"),
    frame("curved-facade", fr23,
      "A grand white Belle Époque hotel facade with a dome and tiers of curved balconies, a palm frond crossing the blue sky above",
      "Built curved, so every balcony gets the same view."),
    frame("red-cars", fr24,
      "Two classic red sports cars parked in a bright showroom garage, one with its engine cover raised",
      "Parked indoors, under lights, like exhibits.", "Monaco"),
    frame("cliff-and-terraces", fr25,
      "Modern terraced apartment blocks stacked against a pale limestone cliff, seen past an older balconied facade in the foreground",
      "The cliff ran out, so they kept building up it.", "Monaco"),
  ],

  "spain-2025": [
    frame("rooftops-at-dusk", es01,
      "A rooftop view across a city at dusk, lit signage on the buildings below and the skyline fading to orange behind",
      "The city from above, at the hour it starts lighting up.", "Madrid"),
    frame("vermouth-and-olives", es02,
      "A metal café table with a tall glass of red vermouth and a bowl of olives, a tree-lined plaza with empty terraces behind",
      "A red vermouth, and the plaza still waking up."),
    frame("hotel-suizo", es03,
      "A rooftop sign reading Hotel Suizo above a pale apartment block, lit gold by low sun under a sky of small clouds",
      "The sign catches the sun a while after the street loses it.", "Barcelona"),
    frame("mural-corridor", es04,
      "A corridor with an ornate coffered ceiling and a long mural in bright blues and pinks, a neon sign reading eat better live longer",
      "An old ceiling and a very new wall."),
    frame("beach-at-night", es05,
      "A dark empty beach at night, the lit sail-shaped silhouette of a seafront hotel standing at the far end of the sand",
      "The beach empties and the hotel keeps its lights on.", "Barcelona"),
    frame("tattoo-parlour", es06,
      "A yellow-fronted tattoo parlour with hand-painted gold lettering reading Tatuajes across its windows",
      "Hand-painted signage, doing more work than most shopfronts."),
    frame("stained-glass-shadow", es07,
      "The photographer's long shadow cast on a stone floor washed with green, pink and blue light from stained glass, their shoes at the bottom of the frame",
      "You stand in the window whether you meant to or not.", "Barcelona"),
    frame("swirling-ceiling", es08,
      "A white plaster ceiling swirling in a spiral around a crystal chandelier, ornate stained-glass doors below",
      "The ceiling turns around the light fitting.", "Barcelona"),
    frame("blue-glass-room", es09,
      "A room with bone-like stone columns and a wall of wavy glazing set with blue circular panes, visitors standing at the windows",
      "The blue is strongest at the top, where the light is.", "Barcelona"),
    frame("basilica-from-below", es10,
      "The ornate stone facade and spires of a large basilica photographed steeply from below against a deep blue evening sky",
      "There is no distance at which it fits in the frame.", "Barcelona"),
    frame("balcony-in-gold", es11,
      "A warm ochre building facade lit gold by low evening sun, a person standing out on one of the wrought-iron balconies",
      "One balcony occupied, at exactly the right hour."),
    frame("cathedral-arches", es12,
      "The dark interior of a Gothic cathedral, massive columns and pointed arches receding toward lit stained-glass windows",
      "Built dark, so the windows have something to do."),
    frame("vaults-and-rose", es13,
      "Gothic stone vaults lit warm from below, with a rose window and tall lancet windows glowing violet in the wall beneath",
      "The vaults hold the warm light; the glass keeps the cold."),
  ],

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
