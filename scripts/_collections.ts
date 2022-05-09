export type Collection = {
  name: string;
  contractAddress: string;
  skipLooksRare?: boolean;
};

const buildCollection = (
  name: string,
  address: string,
  skipLooksRare?: boolean
): Collection => ({
  name,
  contractAddress: address.toLowerCase(),
  skipLooksRare,
});

export const collections: Collection[] = [
  buildCollection("Pixlton", "0x082903f4e94c5e10A2B116a4284940a36AFAEd63"),
  buildCollection(
    "Pixlton Car Club",
    "0x584292974026978586c3007b5a15b69118130bbb"
  ),
  buildCollection(
    "The Wicked Craniums",
    "0x85f740958906b317de6ed79663012859067e745b"
  ),
  buildCollection("Blitnauts", "0x448f3219cf2a23b0527a7a0158e7264b87f635db"),
  buildCollection(
    "Crypto Corgis",
    "0x51e613727fdd2e0B91b51c3E5427E9440a7957E4"
  ),
  buildCollection(
    "Bored Ape Yacht Club",
    "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
  ),
  buildCollection("Moonbirds", "0x23581767a106ae21c074b2276D25e5C3e136a68b"),
  buildCollection("Azuki", "0xED5AF388653567Af2F388E6224dC7C4b3241C544"),
  buildCollection("Arcade Land", "0x4a8c9d751eeabc5521a68fb080dd7e72e46462af"),
  buildCollection("Hashmasks", "0xc2c747e0f7004f9e8817db2ca4997657a7746928"),

  // art blocks
  buildCollection("AB", "unigrids-by-zeblocks", true),
  buildCollection("AB", "ringers-by-dmitri-cherniak", true),
  buildCollection("AB", "archetype-by-kjetil-golid", true),
  buildCollection("AB", "paper-armada-by-kjetil-golid", true),
  buildCollection("AB", "algobots-by-stina-jones", true),
  buildCollection("AB", "subscapes-by-matt-deslauriers", true),
  buildCollection("AB", "algorhythms-by-han-x-nicolas-daniel", true),
  buildCollection("AB", "fidenza-by-tyler-hobbs", true),
  buildCollection("AB", "gravity-12-by-jimmy-herdberg", true),
];
