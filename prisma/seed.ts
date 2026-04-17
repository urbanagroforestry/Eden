import { PrismaClient, Layer, Confidence } from "@prisma/client";

const prisma = new PrismaClient();

type PlantSeed = {
  id: string;
  commonName: string;
  scientificName: string;
  layer: Layer;
  supportRole?: string;
  edibleCategory: string;
  edibleUse: string;
  hardinessMin: number;
  hardinessMax: number;
  regionalTags: string;
  sunNeeds: string;
  waterNeeds: string;
  soilTolerance: string;
  drainageTolerance: string;
  pHTolerance: string;
  matureHeight: number;
  matureWidth: number;
  spreadHabit: string;
  rootBehavior: string;
  maintenanceLevel: string;
  rootRiskNearFoundation: number;
  messyFruitRisk: number;
  childFriendlyFlag: boolean;
  pollinatorValue: number;
  biodiversityValue: number;
  productionValue: number;
  aestheticValue: number;
  neighborhoodFriendliness: number;
  notes: string;
  cautions: string;
  imagePath?: string;
};

const layerTemplates: Record<Layer, Omit<PlantSeed, "id" | "commonName" | "scientificName" | "layer">> = {
  CANOPY: {supportRole: undefined, edibleCategory: "fruit/nut", edibleUse: "fresh/eating", hardinessMin: 5, hardinessMax: 9, regionalTags: "temperate,humid,continental", sunNeeds: "full-sun", waterNeeds: "medium", soilTolerance: "loam-clay", drainageTolerance: "well-drained", pHTolerance: "6.0-7.5", matureHeight: 10, matureWidth: 8, spreadHabit: "upright", rootBehavior: "deep", maintenanceLevel: "medium", rootRiskNearFoundation: 3, messyFruitRisk: 3, childFriendlyFlag: true, pollinatorValue: 3, biodiversityValue: 4, productionValue: 5, aestheticValue: 4, neighborhoodFriendliness: 3, notes: "Canopy anchor species.", cautions: "Allow setback from utilities."},
  LOW_TREE: {supportRole: undefined, edibleCategory: "fruit", edibleUse: "fresh", hardinessMin: 6, hardinessMax: 10, regionalTags: "temperate,mediterranean", sunNeeds: "full-sun/part-shade", waterNeeds: "medium", soilTolerance: "loam", drainageTolerance: "well-drained", pHTolerance: "6.0-7.0", matureHeight: 6, matureWidth: 5, spreadHabit: "rounded", rootBehavior: "moderate", maintenanceLevel: "medium", rootRiskNearFoundation: 2, messyFruitRisk: 3, childFriendlyFlag: true, pollinatorValue: 4, biodiversityValue: 4, productionValue: 4, aestheticValue: 4, neighborhoodFriendliness: 4, notes: "Understory productivity.", cautions: "Prune to retain light."},
  SHRUB: {supportRole: undefined, edibleCategory: "berry", edibleUse: "fresh/jam", hardinessMin: 4, hardinessMax: 10, regionalTags: "nationwide", sunNeeds: "full-sun/part-shade", waterNeeds: "medium", soilTolerance: "acidic-loam", drainageTolerance: "well-drained", pHTolerance: "5.5-7.0", matureHeight: 2, matureWidth: 2, spreadHabit: "mounded", rootBehavior: "fibrous", maintenanceLevel: "low", rootRiskNearFoundation: 1, messyFruitRisk: 2, childFriendlyFlag: true, pollinatorValue: 5, biodiversityValue: 4, productionValue: 4, aestheticValue: 4, neighborhoodFriendliness: 5, notes: "Shrub layer workhorse.", cautions: "Netting may be needed for birds."},
  HERBACEOUS: {supportRole: undefined, edibleCategory: "herb/leaf", edibleUse: "culinary", hardinessMin: 5, hardinessMax: 10, regionalTags: "nationwide", sunNeeds: "part-shade/full-sun", waterNeeds: "medium", soilTolerance: "loam", drainageTolerance: "well-drained", pHTolerance: "6.0-7.5", matureHeight: 0.8, matureWidth: 0.6, spreadHabit: "clumping", rootBehavior: "shallow", maintenanceLevel: "low", rootRiskNearFoundation: 1, messyFruitRisk: 1, childFriendlyFlag: true, pollinatorValue: 4, biodiversityValue: 4, productionValue: 3, aestheticValue: 4, neighborhoodFriendliness: 5, notes: "Fills seasonal gaps.", cautions: "Cutback after frost."},
  GROUNDCOVER: {supportRole: undefined, edibleCategory: "fruit/leaf", edibleUse: "fresh/tea", hardinessMin: 4, hardinessMax: 10, regionalTags: "nationwide", sunNeeds: "part-shade/full-sun", waterNeeds: "low-medium", soilTolerance: "sandy-loam", drainageTolerance: "well-drained", pHTolerance: "5.5-7.0", matureHeight: 0.2, matureWidth: 0.7, spreadHabit: "spreading", rootBehavior: "shallow-mat", maintenanceLevel: "low", rootRiskNearFoundation: 1, messyFruitRisk: 1, childFriendlyFlag: true, pollinatorValue: 3, biodiversityValue: 3, productionValue: 3, aestheticValue: 4, neighborhoodFriendliness: 5, notes: "Living mulch.", cautions: "Can compete in tight beds."},
  RHIZOSPHERE: {supportRole: undefined, edibleCategory: "root", edibleUse: "cooked/raw", hardinessMin: 4, hardinessMax: 10, regionalTags: "nationwide", sunNeeds: "full-sun", waterNeeds: "medium", soilTolerance: "friable-loam", drainageTolerance: "well-drained", pHTolerance: "6.0-7.5", matureHeight: 0.6, matureWidth: 0.4, spreadHabit: "tufted", rootBehavior: "taproot/tuber", maintenanceLevel: "medium", rootRiskNearFoundation: 1, messyFruitRisk: 1, childFriendlyFlag: true, pollinatorValue: 2, biodiversityValue: 3, productionValue: 4, aestheticValue: 3, neighborhoodFriendliness: 4, notes: "Edible roots and storage.", cautions: "Requires soil loosening."},
  VERTICAL: {supportRole: undefined, edibleCategory: "fruit", edibleUse: "fresh", hardinessMin: 5, hardinessMax: 10, regionalTags: "temperate,warm", sunNeeds: "full-sun", waterNeeds: "medium", soilTolerance: "loam", drainageTolerance: "well-drained", pHTolerance: "6.0-7.5", matureHeight: 4, matureWidth: 1.5, spreadHabit: "vining", rootBehavior: "moderate", maintenanceLevel: "medium", rootRiskNearFoundation: 2, messyFruitRisk: 2, childFriendlyFlag: true, pollinatorValue: 4, biodiversityValue: 4, productionValue: 4, aestheticValue: 4, neighborhoodFriendliness: 4, notes: "Uses vertical space.", cautions: "Needs trellis/pruning."},
  SUPPORT: {supportRole: "pollinator", edibleCategory: "support", edibleUse: "ecology", hardinessMin: 4, hardinessMax: 10, regionalTags: "nationwide", sunNeeds: "full-sun/part-shade", waterNeeds: "low-medium", soilTolerance: "wide", drainageTolerance: "wide", pHTolerance: "5.5-7.8", matureHeight: 1.2, matureWidth: 1, spreadHabit: "clumping", rootBehavior: "fibrous", maintenanceLevel: "low", rootRiskNearFoundation: 1, messyFruitRisk: 1, childFriendlyFlag: true, pollinatorValue: 5, biodiversityValue: 5, productionValue: 1, aestheticValue: 4, neighborhoodFriendliness: 5, notes: "Ecological support species.", cautions: "Not primarily for food yield."}
};

const species: Record<Layer, [string, string][]> = {
  CANOPY: [["Chestnut", "Castanea dentata"],["Pecan", "Carya illinoinensis"],["Mulberry", "Morus rubra"],["Walnut", "Juglans nigra"],["Persimmon", "Diospyros virginiana"],["Apple Standard", "Malus domestica"],["Pear Standard", "Pyrus communis"],["Oak (acorn)", "Quercus alba"],["Honey Locust", "Gleditsia triacanthos"],["Black Cherry", "Prunus serotina"],["Pawpaw Tall", "Asimina triloba"]],
  LOW_TREE: [["Peach", "Prunus persica"],["Plum", "Prunus domestica"],["Apricot", "Prunus armeniaca"],["Fig", "Ficus carica"],["Loquat", "Eriobotrya japonica"],["Serviceberry", "Amelanchier alnifolia"],["Dwarf Apple", "Malus domestica dwarf"],["Dwarf Pear", "Pyrus communis dwarf"],["Jujube", "Ziziphus jujuba"],["Quince", "Cydonia oblonga"],["Medlar", "Mespilus germanica"]],
  SHRUB: [["Blueberry", "Vaccinium corymbosum"],["Raspberry", "Rubus idaeus"],["Blackberry", "Rubus fruticosus"],["Currant", "Ribes rubrum"],["Gooseberry", "Ribes uva-crispa"],["Aronia", "Aronia melanocarpa"],["Elderberry", "Sambucus canadensis"],["Sea Buckthorn", "Hippophae rhamnoides"],["Goji", "Lycium barbarum"],["Huckleberry", "Gaylussacia baccata"],["Nanking Cherry", "Prunus tomentosa"],["Wax Myrtle", "Morella cerifera"]],
  HERBACEOUS: [["Comfrey", "Symphytum officinale"],["Lemon Balm", "Melissa officinalis"],["Sorrel", "Rumex acetosa"],["Chives", "Allium schoenoprasum"],["Yarrow", "Achillea millefolium"],["Calendula", "Calendula officinalis"],["Borage", "Borago officinalis"],["Mint", "Mentha spicata"],["Bee Balm", "Monarda didyma"],["Oregano", "Origanum vulgare"],["Sage", "Salvia officinalis"],["Fennel", "Foeniculum vulgare"],["Lovage", "Levisticum officinale"],["Nettle", "Urtica dioica"]],
  GROUNDCOVER: [["Strawberry", "Fragaria x ananassa"],["Creeping Thyme", "Thymus serpyllum"],["Clover", "Trifolium repens"],["Ajuga", "Ajuga reptans"],["Creeping Raspberry", "Rubus hayata-koidzumii"],["Oregano Mat", "Origanum vulgare prostratum"],["Sweet Woodruff", "Galium odoratum"],["Alpine Strawberry", "Fragaria vesca"],["Wintergreen", "Gaultheria procumbens"],["Kinnikinnick", "Arctostaphylos uva-ursi"],["Creeping Rosemary", "Salvia rosmarinus prostratus"],["Purslane", "Portulaca oleracea"]],
  RHIZOSPHERE: [["Garlic", "Allium sativum"],["Onion", "Allium cepa"],["Jerusalem Artichoke", "Helianthus tuberosus"],["Daikon", "Raphanus sativus var. longipinnatus"],["Beet", "Beta vulgaris"],["Carrot", "Daucus carota"],["Parsnip", "Pastinaca sativa"],["Skirret", "Sium sisarum"],["Salsify", "Tragopogon porrifolius"],["Turmeric", "Curcuma longa"],["Ginger", "Zingiber officinale"],["Yacon", "Smallanthus sonchifolius"]],
  VERTICAL: [["Grape", "Vitis vinifera"],["Hardy Kiwi", "Actinidia arguta"],["Passionfruit", "Passiflora incarnata"],["Hops", "Humulus lupulus"],["Scarlet Runner Bean", "Phaseolus coccineus"],["Pole Bean", "Phaseolus vulgaris"],["Malabar Spinach", "Basella alba"],["Chayote", "Sechium edule"],["Maypop", "Passiflora incarnata"],["Akebia", "Akebia quinata"],["Climbing Nasturtium", "Tropaeolum majus"],["Groundnut", "Apios americana"]],
  SUPPORT: [["Lupine", "Lupinus perennis"],["White Clover", "Trifolium repens"],["Crimson Clover", "Trifolium incarnatum"],["Vetch", "Vicia sativa"],["Phacelia", "Phacelia tanacetifolia"],["Dill", "Anethum graveolens"],["Cosmos", "Cosmos bipinnatus"],["Nasturtium", "Tropaeolum majus"],["Buckwheat", "Fagopyrum esculentum"],["Alyssum", "Lobularia maritima"],["Goldenrod", "Solidago canadensis"],["Milkweed", "Asclepias syriaca"],["Joe Pye Weed", "Eutrochium purpureum"],["Switchgrass", "Panicum virgatum"]]
};

function buildPlants(): PlantSeed[] {
  const plants: PlantSeed[] = [];
  (Object.keys(species) as Layer[]).forEach((layer) => {
    species[layer].forEach(([commonName, scientificName], idx) => {
      const base = layerTemplates[layer];
      plants.push({
        ...base,
        id: `${layer.toLowerCase()}_${idx + 1}`,
        commonName,
        scientificName,
        layer,
        supportRole: layer === Layer.SUPPORT ? ["insectary", "pollinator", "nitrogen-fixer", "chop-drop", "dynamic-accumulator"][idx % 5] : undefined,
        hardinessMin: Math.max(3, base.hardinessMin - (idx % 2)),
        hardinessMax: Math.min(11, base.hardinessMax + (idx % 2)),
        waterNeeds: ["low", "medium", "high"][idx % 3],
        maintenanceLevel: ["low", "medium", "high"][idx % 3],
        sunNeeds: ["full-sun", "part-shade", "full-sun/part-shade"][idx % 3],
        productionValue: Math.min(5, base.productionValue + (idx % 2)),
        notes: `${base.notes} Demo profile ${idx + 1}.`
      });
    });
  });
  return plants;
}

async function main() {
  await prisma.layoutItem.deleteMany();
  await prisma.uploadedAsset.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.siteProfile.deleteMany();
  await prisma.project.deleteMany();
  await prisma.plant.deleteMany();

  const plants = buildPlants();

  const perLayer = plants.reduce((acc, plant) => {
    acc[plant.layer] = (acc[plant.layer] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [layer, count] of Object.entries(perLayer)) {
    if (count < 10) throw new Error(`Layer ${layer} is underrepresented in seed data: ${count}`);
  }

  for (const plant of plants) {
    await prisma.plant.create({ data: plant });
  }

  const demos = [
    { name: "Portland Backyard Demo", address: "2835 SE Belmont St, Portland, OR", latitude: 45.516, longitude: -122.637, area: 920, zone: "8b", rain: "high" },
    { name: "Austin Suburban Demo", address: "1400 W 35th St, Austin, TX", latitude: 30.307, longitude: -97.748, area: 780, zone: "8a", rain: "medium" },
    { name: "Atlanta Front Yard Demo", address: "725 Ponce De Leon Ave NE, Atlanta, GA", latitude: 33.773, longitude: -84.363, area: 610, zone: "8a", rain: "medium-high" }
  ];

  for (const [i, demo] of demos.entries()) {
    const p = await prisma.project.create({
      data: {
        name: demo.name,
        address: demo.address,
        latitude: demo.latitude,
        longitude: demo.longitude,
        boundaryGeoJson: JSON.stringify([[demo.longitude - 0.0007, demo.latitude - 0.0005], [demo.longitude + 0.0007, demo.latitude - 0.0005], [demo.longitude + 0.0007, demo.latitude + 0.0005], [demo.longitude - 0.0007, demo.latitude + 0.0005]]),
        shadeGeoJson: JSON.stringify([{ id: "sz-1", level: "part-shade", points: [[demo.longitude, demo.latitude]] }]),
        structuresJson: JSON.stringify([{ id: "st-1", type: "tree", lat: demo.latitude + 0.0001, lon: demo.longitude - 0.0001 }])
      }
    });

    await prisma.siteProfile.create({
      data: {
        projectId: p.id,
        lotAreaSqm: demo.area,
        hardinessZone: demo.zone,
        hardinessConfidence: Confidence.MEDIUM,
        precipitationBand: demo.rain,
        precipitationConf: Confidence.MEDIUM,
        sunExposureJson: JSON.stringify({ "full-sun": 0.52, "part-shade": 0.34, shade: 0.14 }),
        slopeAspect: "gentle south-east",
        slopeConfidence: Confidence.VERIFY,
        zoneAreasJson: JSON.stringify({ foundation: 110, edge: 180, open: 470, access: 160 })
      }
    });

    await prisma.userPreferences.create({
      data: {
        projectId: p.id,
        goals: JSON.stringify(["foodProduction", "biodiversity", "pollinators"]),
        maintenanceTolerance: i === 1 ? "low" : "medium",
        irrigationTolerance: "medium",
        stylePreference: i === 2 ? "tidy-neighborhood-friendly" : "balanced",
        householdPriorities: JSON.stringify(["fruit", "herbs", "habitat"]),
        constraints: JSON.stringify(["avoidLargeRootsNearFoundation", "hoaTidyFrontYard"]),
        templateKey: ["balanced-suburban", "production-focused", "tidy-front-yard"][i]
      }
    });
  }

  console.log(`Seeded ${plants.length} plants and ${demos.length} projects.`);
}

main().finally(async () => prisma.$disconnect());
