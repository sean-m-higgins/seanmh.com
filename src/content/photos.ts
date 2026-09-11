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

import e01 from "../assets/trips/spain-2014/01-1-barcelona.jpg";
import e02 from "../assets/trips/spain-2014/02-2-barcelona.jpg";
import e03 from "../assets/trips/spain-2014/03-3-barcelona.jpg";
import e04 from "../assets/trips/spain-2014/04-4-barcelona.jpg";
import e05 from "../assets/trips/spain-2014/05-5-barcelona.jpg";
import e06 from "../assets/trips/spain-2014/06-6-barcelona.jpg";
import e07 from "../assets/trips/spain-2014/07-7-barcelona.jpg";
import e08 from "../assets/trips/spain-2014/08-8-barcelona.jpg";
import e09 from "../assets/trips/spain-2014/09-9-barcelona.jpg";
import e10 from "../assets/trips/spain-2014/10-10-barcelona.jpg";
import e11 from "../assets/trips/spain-2014/11-11-barcelona.jpg";
import e12 from "../assets/trips/spain-2014/12-12-barcelona.jpg";
import e13 from "../assets/trips/spain-2014/13-13-barcelona.jpg";
import e14 from "../assets/trips/spain-2014/14-14-barcelona.jpg";
import e15 from "../assets/trips/spain-2014/15-15-barcelona.jpg";
import e16 from "../assets/trips/spain-2014/16-16-montserrat.jpg";
import e17 from "../assets/trips/spain-2014/17-17-montserrat.jpg";
import e18 from "../assets/trips/spain-2014/18-18-montserrat.jpg";
import e19 from "../assets/trips/spain-2014/19-19-montserrat.jpg";
import e20 from "../assets/trips/spain-2014/20-20-montserrat.jpg";
import e21 from "../assets/trips/spain-2014/21-21-montserrat.jpg";
import e22 from "../assets/trips/spain-2014/22-22-montserrat.jpg";
import e23 from "../assets/trips/spain-2014/23-23-montserrat.jpg";
import e24 from "../assets/trips/spain-2014/24-24-montserrat.jpg";
import e25 from "../assets/trips/spain-2014/25-25-manresa.jpg";
import e26 from "../assets/trips/spain-2014/26-26-manresa.jpg";
import e27 from "../assets/trips/spain-2014/27-27-manresa.jpg";
import e28 from "../assets/trips/spain-2014/28-28-pamplona.jpg";
import e29 from "../assets/trips/spain-2014/29-29-pamplona.jpg";
import e30 from "../assets/trips/spain-2014/30-30-pamplona.jpg";
import e31 from "../assets/trips/spain-2014/31-31-bilbao.jpg";
import e32 from "../assets/trips/spain-2014/32-32-bilbao.jpg";
import e33 from "../assets/trips/spain-2014/33-33-bilbao.jpg";
import e34 from "../assets/trips/spain-2014/34-34-bilbao.jpg";
import e35 from "../assets/trips/spain-2014/35-35-bilbao.jpg";
import e36 from "../assets/trips/spain-2014/36-36-bilbao.jpg";
import e37 from "../assets/trips/spain-2014/37-37-bilbao.jpg";
import e38 from "../assets/trips/spain-2014/38-38-sansebastian.jpg";
import e39 from "../assets/trips/spain-2014/39-39-sansebastian.jpg";
import e40 from "../assets/trips/spain-2014/40-40-sansebastian.jpg";
import e41 from "../assets/trips/spain-2014/41-41-sansebastian.jpg";
import e42 from "../assets/trips/spain-2014/42-42-sansebastian.jpg";
import e43 from "../assets/trips/spain-2014/43-43-sansebastian.jpg";
import e44 from "../assets/trips/spain-2014/44-44-azpeitia.jpg";
import e45 from "../assets/trips/spain-2014/45-45-azpeitia.jpg";
import e46 from "../assets/trips/spain-2014/46-46-azpeitia.jpg";
import e47 from "../assets/trips/spain-2014/47-47-azpeitia.jpg";
import e48 from "../assets/trips/spain-2014/48-48-azpeitia.jpg";
import e49 from "../assets/trips/spain-2014/49-49-azpeitia.jpg";
import e50 from "../assets/trips/spain-2014/50-50-azpeitia.jpg";
import e51 from "../assets/trips/spain-2014/51-51-burgos.jpg";
import e52 from "../assets/trips/spain-2014/52-52-burgos.jpg";
import e53 from "../assets/trips/spain-2014/53-53-burgos.jpg";
import e54 from "../assets/trips/spain-2014/54-54-burgos.jpg";
import e55 from "../assets/trips/spain-2014/55-55-burgos.jpg";
import e56 from "../assets/trips/spain-2014/56-56-burgos.jpg";
import e57 from "../assets/trips/spain-2014/57-57-segovia.jpg";
import e58 from "../assets/trips/spain-2014/58-58-segovia.jpg";
import e59 from "../assets/trips/spain-2014/59-59-segovia.jpg";
import e60 from "../assets/trips/spain-2014/60-60-segovia.jpg";
import e61 from "../assets/trips/spain-2014/61-61-segovia.jpg";
import e62 from "../assets/trips/spain-2014/62-62-segovia.jpg";
import e63 from "../assets/trips/spain-2014/63-63-segovia.jpg";
import e64 from "../assets/trips/spain-2014/64-64-segovia.jpg";
import e65 from "../assets/trips/spain-2014/65-65-segovia.jpg";
import e66 from "../assets/trips/spain-2014/66-66-segovia.jpg";
import e67 from "../assets/trips/spain-2014/67-67-segovia.jpg";
import e68 from "../assets/trips/spain-2014/68-68-madrid.jpg";
import e69 from "../assets/trips/spain-2014/69-69-madrid.jpg";
import e70 from "../assets/trips/spain-2014/70-70-madrid.jpg";
import e71 from "../assets/trips/spain-2014/71-71-madrid.jpg";
import e72 from "../assets/trips/spain-2014/72-72-madrid.jpg";
import e73 from "../assets/trips/spain-2014/73-73-madrid.jpg";
import e74 from "../assets/trips/spain-2014/74-74-madrid.jpg";
import e75 from "../assets/trips/spain-2014/75-75-madrid.jpg";
import e76 from "../assets/trips/spain-2014/76-76-madrid.jpg";
import e77 from "../assets/trips/spain-2014/77-77-madrid.jpg";
import e78 from "../assets/trips/spain-2014/78-78-toledo.jpg";
import e79 from "../assets/trips/spain-2014/79-79-toledo.jpg";
import e80 from "../assets/trips/spain-2014/80-80-toledo.jpg";
import e81 from "../assets/trips/spain-2014/81-81-toledo.jpg";
import e82 from "../assets/trips/spain-2014/82-82-toledo.jpg";
import e83 from "../assets/trips/spain-2014/83-83-toledo.jpg";
import e84 from "../assets/trips/spain-2014/84-84-toledo.jpg";

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
      "Tilted in the shallows, deliberately, like something run aground.", "Oslo"),
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
      "Deep blue sky, and a tram to be somewhere else by.", "Nice"),
    frame("arch-downhill", fr02,
      "A tall stone triumphal arch framing a street that runs downhill between pale buildings toward distant hills, with people crossing beneath",
      "The arch frames the street, and the street frames the hills.", "Marseille"),
    frame("cat-on-the-wall", fr03,
      "An ochre apartment facade with shutters and a washing line, a cat walking along the top of a cracked garden wall below",
      "The cat had the better route.", "Marseille"),
    frame("gallery-two-floors", fr04,
      "The interior of a gallery over two levels, hung with large abstract paintings in blue, red and orange",
      "Two floors, and no wall left empty.", "Marseille"),
    frame("passage-de-lorette", fr05,
      "A tiled entrance under a gilded sign reading Passage de Lorette, with a mosaic panel of a city and its harbour above the doorway",
      "The passage puts a map of the city over its own door.", "Marseille"),
    frame("stork-panel", fr06,
      "A mosaic panel of a white stork standing in grass, set into a plain rendered wall beside a young tree",
      "A stork set into the render, facing the street.", "Marseille"),
    frame("harbour-mural", fr07,
      "A large sepia mural of an old working harbour with cranes and sailing ships, painted across a wall beneath a blue street sign",
      "The old port, painted on a wall a long way from it.", "Marseille"),
    frame("kitchen-counter", fr08,
      "A cook working behind a small restaurant counter, turquoise tiles and hanging pans behind him, a folded cloth over the counter edge",
      "One cook, one counter, one thing at a time.", "Marseille"),
    frame("brick-and-crane", fr09,
      "A no-stopping sign in the foreground with a large modern building of patterned brick and a construction crane behind",
      "Still going up behind the sign that says not to stop.", "Montpellier"),
    frame("aqueduct-boulevard", fr10,
      "A long stone aqueduct running beside a tree-lined boulevard in low sun, its arches throwing repeated shadows across the pavement",
      "The arches keep going long after the road stops caring.", "Montpellier"),
    frame("peaks-at-dusk", fr11,
      "Snow-covered alpine peaks above dark forested slopes, the sky fading pink behind them",
      "The peaks kept the light after the valley lost it.", "Alpe d'Huez"),
    frame("wide-slope", fr12,
      "A broad snow-covered ski slope scattered with pines, a piste running down its flank",
      "A whole face, and one line down it.", "Alpe d'Huez"),
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
      "Built curved, so every balcony gets the same view.", "Monaco"),
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
      "A red vermouth, and the plaza still waking up.", "Barcelona"),
    frame("hotel-suizo", es03,
      "A rooftop sign reading Hotel Suizo above a pale apartment block, lit gold by low sun under a sky of small clouds",
      "The sign catches the sun a while after the street loses it.", "Barcelona"),
    frame("mural-corridor", es04,
      "A corridor with an ornate coffered ceiling and a long mural in bright blues and pinks, a neon sign reading eat better live longer",
      "An old ceiling and a very new wall.", "Barcelona"),
    frame("beach-at-night", es05,
      "A dark empty beach at night, the lit sail-shaped silhouette of a seafront hotel standing at the far end of the sand",
      "The beach empties and the hotel keeps its lights on.", "Barcelona"),
    frame("tattoo-parlour", es06,
      "A yellow-fronted tattoo parlour with hand-painted gold lettering reading Tatuajes across its windows",
      "Hand-painted signage, doing more work than most shopfronts.", "Valencia"),
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
      "One balcony occupied, at exactly the right hour.", "Madrid"),
    frame("cathedral-arches", es12,
      "The dark interior of a Gothic cathedral, massive columns and pointed arches receding toward lit stained-glass windows",
      "Built dark, so the windows have something to do.", "Madrid"),
    frame("vaults-and-rose", es13,
      "Gothic stone vaults lit warm from below, with a rose window and tall lancet windows glowing violet in the wall beneath",
      "The vaults hold the warm light; the glass keeps the cold.", "Madrid"),
  ],

  "spain-2014": [
    frame("montjuic-palace", e01,
      "A domed neoclassical palace with corner towers standing on a wooded hill, flagpoles in front of it",
      "The hill keeps the museum and the view both.", "Barcelona"),
    frame("boqueria-entrance", e02,
      "The iron entrance arch of the Sant Josep market under a stained-glass sign, a dense crowd passing beneath",
      "The entrance is a bottleneck, and always was.", "Barcelona"),
    frame("market-ceiling", e03,
      "Inside a covered market, a brightly painted mural ceiling above lit stalls and a crowd of shoppers",
      "Everyone looks down at the stalls; the ceiling gets on with its own thing.", "Barcelona"),
    frame("jamon-counter", e04,
      "A market counter hung with cured hams above a refrigerated case, a vendor working behind it",
      "Hung by the leg at eye level, the length of the aisle.", "Barcelona"),
    frame("placa-reial", e05,
      "An arcaded square with tall palms and an ornate iron lamppost, people sitting along a low bench",
      "Palms, arcades, and a lamppost Gaudí drew before he was Gaudí.", "Barcelona"),
    frame("hanging-lamps", e06,
      "A narrow street strung with round hanging lamps between balconied buildings, a flag overhead",
      "The lamps hang across the street because there is nowhere else to put them.", "Barcelona"),
    frame("plane-tree-street", e07,
      "A broad street lined with plane trees and shopfronts in hard sun, people walking the pavement",
      "Shade down one side, shops down the other.", "Barcelona"),
    frame("park-guell-view", e08,
      "A view across a city to the sea from a terraced park, a tiled pavilion roof in the foreground",
      "From up here the city runs flat all the way to the water.", "Barcelona"),
    frame("park-guell-pavilions", e09,
      "Two stone pavilions with undulating tiled roofs and a spired tower flanking a park entrance, visitors on the steps",
      "Two gatehouses that look drawn rather than built.", "Barcelona"),
    frame("sagrada-nativity", e10,
      "The densely carved Nativity facade of a large basilica, a queue of visitors at its doors",
      "Every surface carved, and a queue that never gets shorter.", "Barcelona"),
    frame("sagrada-cranes", e11,
      "Basilica towers under construction, wrapped in scaffolding with a crane standing alongside",
      "Still a building site, a hundred and thirty years in.", "Barcelona"),
    frame("sagrada-passion", e12,
      "Angular stone figures on a church facade, cut flat and hard against plain gridded windows",
      "The other facade, cut sharp instead of encrusted.", "Barcelona"),
    frame("sagrada-interior", e13,
      "The interior of a basilica where branching stone columns rise into a pale vault, a gilded canopy hanging over the altar",
      "Columns that branch, which is the entire idea.", "Barcelona"),
    frame("sagrada-oculus", e14,
      "A circular stained-glass oculus in greens and blues set into a dark vault, smaller roundels beneath it",
      "Green on this side of the building, all afternoon.", "Barcelona"),
    frame("barcelona-port", e15,
      "A hazy view over a city port from high ground, breakwaters and a marina below a tower block",
      "The port from above, with the haze that comes with August.", "Barcelona"),

    frame("montserrat-ridge", e16,
      "A distant serrated rock massif rising over wooded hills, seen past scrub and rooftops",
      "The ridge is the reason for the name.", "Montserrat"),
    frame("montserrat-drop", e17,
      "A modern building standing at a cliff edge above a deep valley, rock pinnacles rising opposite",
      "Built right up to the edge, because the edge is the point.", "Montserrat"),
    frame("montserrat-terrace", e18,
      "An arcaded stone terrace with statues standing in its niches, two people sitting on a bench",
      "Arches on one side, the whole valley on the other.", "Montserrat"),
    frame("montserrat-funicular", e19,
      "A funicular line running straight up a steep rock face between trees, a station at the top",
      "Straight up the rock, because there is no other line to take.", "Montserrat"),
    frame("montserrat-monastery", e20,
      "Monastery buildings set beneath rounded rock pinnacles under a clear sky",
      "The rock is not a backdrop. It is the fourth wall.", "Montserrat"),
    frame("montserrat-courtyard", e21,
      "A monastery courtyard of tall ochre and stone buildings with rock formations rising directly behind",
      "A courtyard with a mountain for one of its sides.", "Montserrat"),
    frame("loyola-niche", e22,
      "A painted wall niche holding a pale statue, a scrolled banner reading Sanctus Ignatius a Loyola beneath it",
      "Named on a painted ribbon, in case the statue was not enough.", "Montserrat"),
    frame("montserrat-shrine", e23,
      "An ornate gilded shrine with a dark-robed standing figure at its centre, wrought ironwork in front",
      "Gold on every side of a figure carved in black.", "Montserrat"),
    frame("montserrat-glass", e24,
      "The dark interior of a basilica, a rose window and tall stained-glass lancets glowing along the wall",
      "The only light in the room is coloured.", "Montserrat"),

    frame("manresa-flag", e25,
      "A hilltop tower flying a flag, silhouetted above dark trees against a pale sky",
      "A flag on the hill, and little else visible from the road.", "Manresa"),
    frame("manresa-facade", e26,
      "An elaborately carved baroque church facade with statues set between columns, framed by a tree",
      "Carved until there was no flat stone left.", "Manresa"),
    frame("manresa-cave", e27,
      "A gilded glass case set into bare rock inside a cave shrine, marble and giltwork below it",
      "A cave, dressed in marble and gold.", "Manresa"),

    frame("pamplona-peak", e28,
      "A steep conical mountain rising out of green farmland under heavy white cloud",
      "One peak, standing on its own above the fields.", "Pamplona"),
    frame("pamplona-street", e29,
      "A narrow old-town street of balconied buildings in bright sun, a van parked at the near end",
      "Quiet now. Famously not, one week a year.", "Pamplona"),
    frame("pamplona-bullring", e30,
      "Plane trees in front of a bullring's brick exterior, red gates shut and wooden barriers stacked alongside",
      "The barriers stay stacked until July.", "Pamplona"),

    frame("bilbao-river", e31,
      "A city river between stone embankments, apartment blocks and green hills behind, bridges crossing in the distance",
      "A city that turned back to face its river.", "Bilbao"),
    frame("bilbao-puppy", e32,
      "A vast sculpture of a seated dog covered entirely in flowering bedding plants, standing on a plaza",
      "A dog the size of a building, planted rather than cast.", "Bilbao"),
    frame("bilbao-flowers", e33,
      "A dense close view of bedding flowers in pink, orange, yellow and blue covering a curved surface",
      "Close up it is just bedding plants, in tens of thousands.", "Bilbao"),
    frame("guggenheim-entrance", e34,
      "The entrance to a museum with a green Georges Braque exhibition banner above wide stone steps",
      "Braque, that summer.", "Bilbao"),
    frame("bilbao-spheres", e35,
      "A tall column of mirrored steel spheres standing before a titanium-clad museum wall",
      "Mirrored steel against titanium, each reflecting the other.", "Bilbao"),
    frame("bilbao-bridge", e36,
      "A red-pylon bridge passing over a titanium-clad museum beside a river, mist lying on the water",
      "The bridge goes through the building, more or less.", "Bilbao"),
    frame("bilbao-tulips", e37,
      "A cluster of large glossy multicoloured balloon-like flower sculptures on a stone terrace",
      "Balloon flowers, in steel, weighing tons.", "Bilbao"),

    frame("concha-fog", e38,
      "A crescent beach and bay under heavy fog, a marina in the foreground and buildings faint behind",
      "The bay, mostly implied.", "San Sebastián"),
    frame("santa-maria-facade", e39,
      "An ornate baroque church facade with twin bell towers, photographed from directly below",
      "Baroque, stacked up until the wall ran out.", "San Sebastián"),
    frame("sebastian-portal", e40,
      "A carved church portal with a statue of a bound figure pierced by arrows above the door",
      "The city is named for him, and there he is.", "San Sebastián"),
    frame("fish-counter", e41,
      "A market counter of iced fish, hake fillets, squid and shellfish with handwritten euro price cards",
      "Handwritten prices, and all of it landed that morning.", "San Sebastián"),
    frame("concha-mist", e42,
      "A wide sandy beach and bay in thick mist, the far shore barely visible",
      "Mid-August, and this was the weather.", "San Sebastián"),
    frame("low-tide", e43,
      "A broad beach at low tide under grey cloud, a wooded headland standing behind the town",
      "The tide went a long way out and took the light with it.", "San Sebastián"),

    frame("loyola-tower", e44,
      "The corner of a fortified tower house, rough stone below and patterned brick above, seen sharply from beneath",
      "Stone to the first floor, brick above, where the rebuild starts.", "Azpeitia"),
    frame("loyola-chapel", e45,
      "A chapel interior with heavy timber beams, an altar dressed in white flowers, a Basque inscription running along the wall",
      "The inscription is in Basque, and so was the household.", "Azpeitia"),
    frame("loyola-window", e46,
      "A stained-glass window showing a figure lying on a deathbed attended by others",
      "The scene the whole building is arranged around.", "Azpeitia"),
    frame("town-model", e47,
      "A tabletop relief model of a walled town with red roofs, its rivers marked in pale blue",
      "The town as it was, at about a thousandth of the size.", "Azpeitia"),
    frame("basque-hills", e48,
      "Green farmland and woodland on rolling hills, white farmhouses scattered across them",
      "Green in August, which is the north for you.", "Azpeitia"),
    frame("loyola-basilica", e49,
      "A domed baroque sanctuary of grey stone with a broad flight of steps rising to its doors",
      "A round church, built around a house.", "Azpeitia"),
    frame("ihs-altar", e50,
      "A dark stone altar lit from above, an IHS monogram carved into its face beneath a white lace cloth",
      "The monogram lit, and nothing else in the room lit at all.", "Azpeitia"),

    frame("burgos-exterior", e51,
      "The pierced stone spires and rose window of a Gothic cathedral against a blue sky",
      "Openwork spires, which is showing off in stone.", "Burgos"),
    frame("burgos-tympanum", e52,
      "A carved tympanum with a seated central figure surrounded by winged symbols and ranks of smaller figures",
      "Everyone in the carving is looking at the same person.", "Burgos"),
    frame("burgos-retablo", e53,
      "The interior of a Gothic cathedral looking toward a tall gilded altarpiece between stone piers",
      "Gold at the end of a very long grey room.", "Burgos"),
    frame("burgos-choir", e54,
      "Carved wooden choir stalls in two tiers around a hanging chandelier, a stone tomb effigy in the foreground",
      "The effigy lies in the middle of the floor, and the singing went on around it.", "Burgos"),
    frame("burgos-vault", e55,
      "An elaborate star-shaped vault with a glazed lantern at its centre, encrusted with carved figures",
      "Look up and it is a star, and then it is figures the whole way round.", "Burgos"),
    frame("christ-at-the-column", e56,
      "A gilded altarpiece framing a painted figure bound to a column, carved gold on every side",
      "Painted wood, gilded frame, and a great deal of light from the left.", "Burgos"),

    frame("aqueduct-plaza", e57,
      "A Roman aqueduct of two tiers of arches crossing behind a town square and a planted roundabout",
      "It crosses the town at the height it was always going to.", "Segovia"),
    frame("aqueduct-close", e58,
      "The massive granite piers of a Roman aqueduct seen close along a street, a coach parked beneath",
      "Dry stone, no mortar, still standing.", "Segovia"),
    frame("segovia-model", e59,
      "A relief model of a town and the countryside around it, seen from above",
      "The whole town, and the two rivers that decided its shape.", "Segovia"),
    frame("alcazar-towers", e60,
      "A castle of pale stone with slate-roofed turrets and a square keep, a flag flying from the top",
      "Turrets, a keep and a flag — the whole idea of a castle.", "Segovia"),
    frame("armour-hall", e61,
      "Two suits of plate armour standing either side of a wooden door in a plain stone hall",
      "Two suits of armour, posted where the doormen would be.", "Segovia"),
    frame("knight-glass", e62,
      "A stained-glass window of an armoured rider on horseback above a coat of arms",
      "A knight in glass, over the arms he rode for.", "Segovia"),
    frame("meseta-view", e63,
      "A view over dry rolling countryside from a castle balcony, seen through iron railings",
      "Dry country, in every direction from the walls.", "Segovia"),
    frame("gilded-hall", e64,
      "A long hall with a gilded coffered ceiling above red-hung walls and tall arched windows",
      "The ceiling took longer than the walls.", "Segovia"),
    frame("triptych", e65,
      "A large three-panel painting of crowded fantastical figures and landscapes, hung against a red wall",
      "Hundreds of small scenes, and nowhere obvious to start.", "Segovia"),
    frame("crossbow-case", e66,
      "A crossbow and steel helmets displayed together in a glass museum case",
      "A crossbow, and the hats meant to stop one.", "Segovia"),
    frame("alcazar-outside", e67,
      "A castle on a rock outcrop seen from below, turrets and a prow-like end rising above trees",
      "It sits on the rock like a ship pointed downhill.", "Segovia"),

    frame("plaza-mayor", e68,
      "A grand square's painted facade, frescoed figures between balconied windows, flags hanging below",
      "The whole facade is painted, and it is easy to walk past.", "Madrid"),
    frame("las-ventas", e69,
      "A large brick bullring with horseshoe arches and tiled decoration, steps rising to its entrance",
      "Brickwork doing the job of stone.", "Madrid"),
    frame("prado-entrance", e70,
      "A museum entrance with the words Museo del Prado cut into the stone above glass doors",
      "The name cut into the stone, and nothing else announcing it.", "Madrid"),
    frame("quadriga", e71,
      "A bronze four-horse chariot statue standing on a rooftop against a clear blue sky",
      "A chariot on the roof, which is a very particular decision.", "Madrid"),
    frame("brushstroke", e72,
      "A tall sculpture of a folded brushstroke in black and yellow standing before a red-panelled modern building",
      "A brushstroke, made solid and stood upright.", "Madrid"),
    frame("bernabeu-exterior", e73,
      "The exterior of a large football stadium, its name and club crest mounted across the concrete",
      "Concrete, and a name in metal letters.", "Madrid"),
    frame("bernabeu-high", e74,
      "A football pitch seen from the upper tier of an empty stadium, event staging set up on the grass",
      "Something being built on the pitch, out of season.", "Madrid"),
    frame("bernabeu-tiers", e75,
      "Steep tiers of blue and orange seating curving around an empty stadium bowl",
      "Empty, it is mostly a very steep wall of seats.", "Madrid"),
    frame("golden-boot", e76,
      "A lit display case holding a golden boot trophy beneath a large photograph of a footballer celebrating",
      "One boot, lit like a relic.", "Madrid"),
    frame("bernabeu-pitch", e77,
      "A football pitch from ground level, stands rising behind it and staging on the far side",
      "Down at grass level, the stands lean in.", "Madrid"),

    frame("toledo-panorama", e78,
      "A hillside city of pale stone above a river gorge, a large square fortress standing on the skyline",
      "The whole city sits above its own river.", "Toledo"),
    frame("tagus-gorge", e79,
      "A river running through a rocky gorge below a town, a bridge and buildings on the far slope",
      "The river does the work a wall would otherwise have had to.", "Toledo"),
    frame("toledo-cathedral", e80,
      "A tall Gothic cathedral spire rising above a dense field of tiled rooftops",
      "One spire, and everything else kept below the roofline.", "Toledo"),
    frame("toledo-academy", e81,
      "A large symmetrical institutional building on a ridge above scrub, a flag at its centre",
      "Built to be seen from the city it looks down on.", "Toledo"),
    frame("toledo-castle", e82,
      "A small castle with square towers and curtain walls standing in dry open countryside",
      "Guarding the approach, on the side the city could not see.", "Toledo"),
    frame("toledo-weir", e83,
      "A weir crossing a river below a rocky slope topped with houses and cypresses",
      "The weir is old. The houses above it are not.", "Toledo"),
    frame("weir-house", e84,
      "A stone building with arched windows standing at the end of a weir, water breaking white beneath it",
      "Someone built a house on the weir, and it is still there.", "Toledo"),
  ],
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
