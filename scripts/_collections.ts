export type Collection = {
  name: string;
  contractAddress: string;
  totalSupply: number;
};

export const collections: Collection[] = [
  {
    name: "The Wicked Craniums",
    contractAddress: "0x85f740958906b317de6ed79663012859067e745b".toLowerCase(),
    totalSupply: 10762,
  },
  {
    name: "Pixlton Car Club",
    contractAddress: "0x584292974026978586c3007b5a15b69118130bbb".toLowerCase(),
    totalSupply: 4006,
  },
  {
    name: "Pixls",
    contractAddress: "0x082903f4e94c5e10A2B116a4284940a36AFAEd63".toLowerCase(),
    totalSupply: 5471,
  },
  {
    name: "Hashmasks",
    contractAddress: "0xc2c747e0f7004f9e8817db2ca4997657a7746928".toLowerCase(),
    totalSupply: 16384,
  },
  {
    name: "The Blitnauts",
    contractAddress: "0x448f3219cf2a23b0527a7a0158e7264b87f635db".toLowerCase(),
    totalSupply: 1484,
  },
  {
    name: "MirrorWorld",
    contractAddress: "0x7592e2f251a7f7da27211625d652092769f43a60".toLowerCase(),
    totalSupply: 6580,
  },
  {
    name: "Crypto Corgis",
    contractAddress: "0x51e613727fdd2e0B91b51c3E5427E9440a7957E4".toLowerCase(),
    totalSupply: 10000,
  },
];
