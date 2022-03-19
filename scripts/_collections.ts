export type Collection = {
  name: string;
  contractAddress: string;
};

const buildCollection = (name: string, address: string): Collection => ({
  name,
  contractAddress: address.toLowerCase(),
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
  buildCollection("Hashmasks", "0xc2c747e0f7004f9e8817db2ca4997657a7746928"),
  buildCollection("Blitnauts", "0x448f3219cf2a23b0527a7a0158e7264b87f635db"),
  buildCollection("MirrorWorld", "0x7592e2f251a7f7da27211625d652092769f43a60"),
  buildCollection(
    "Crypto Corgis",
    "0x51e613727fdd2e0B91b51c3E5427E9440a7957E4"
  ),
  buildCollection(
    "Bored Ape Yacht Club",
    "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
  ),
];
