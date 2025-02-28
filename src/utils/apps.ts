import {
  BankNote01,
  BarChartSquare01,
  CodeBrowser,
  GamingPad01,
  Globe02,
  Grid01,
  Image03,
  ImageUser,
  MessageSmileCircle,
  Scales02,
  Server04,
  Users03
} from "@untitled-ui/icons-react";
import BotegaIcon from "url:/assets/ecosystem/botega.svg";
import CoinMakerIcon from "url:/assets/ecosystem/coinmaker.svg";
import LongviewLabsIcon from "url:/assets/ecosystem/longview.svg";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import AstroIcon from "url:/assets/ecosystem/astro.svg";
import BazarIcon from "url:/assets/ecosystem/bazar.svg";
import ProtocolLandIcon from "url:/assets/ecosystem/protocolland.svg";
import ViewblockIcon from "url:/assets/ecosystem/viewblock.svg";
import AoxIcon from "url:/assets/ecosystem/aox.png";
import PerplexIcon from "url:/assets/ecosystem/perplex.svg";
import PermaswapIcon from "url:/assets/ecosystem/permaswap.svg";
import OutcomeIcon from "url:/assets/ecosystem/outcome.svg";
import EverpayIcon from "url:/assets/ecosystem/everpay.svg";
import QuantumIcon from "url:/assets/ecosystem/quantum.svg";
import AoIcon from "url:/assets/ecosystem/aomint.svg";
import AoCraftIcon from "url:/assets/ecosystem/aocraft.png";
import ArweavePIIcon from "url:/assets/ecosystem/arweavephilippines.png";
import ArweaveAfricaIcon from "url:/assets/ecosystem/arweaveafrica.png";
import ArweaveOasisIcon from "url:/assets/ecosystem/arweaveoasis.png";
import DexiIcon from "url:/assets/ecosystem/dexi.svg";
import LlamaLandIcon from "url:/assets/ecosystem/llamaland.png";
import AosLlamaIcon from "url:/assets/ecosystem/aosllama.png";
import TyprIcon from "url:/assets/ecosystem/typr.png";
import ArDriveIcon from "url:/assets/ecosystem/ardrive.png";
import AoWarIcon from "url:/assets/ecosystem/aowar.png";
import BazarmashIcon from "url:/assets/ecosystem/bazarmash.png";
import CasinaoIcon from "url:/assets/ecosystem/casinao.svg";
import CyberweaversIcon from "url:/assets/ecosystem/cyberweavers.png";
import DimensionlifeIcon from "url:/assets/ecosystem/dimensionlife.png";
import DumDumUpIcon from "url:/assets/ecosystem/dumdumup.png";
import DumverseIcon from "url:/assets/ecosystem/dumverse.png";
import HangoutIcon from "url:/assets/ecosystem/hangout.svg";
import HappyfarmIcon from "url:/assets/ecosystem/happyfarm.png";
import DumdumDumIcon from "url:/assets/ecosystem/dumdumdum.png";
import AolinkIcon from "url:/assets/ecosystem/aolink.svg";
import AlexIcon from "url:/assets/ecosystem/alex.svg";
import ArfleetIcon from "url:/assets/ecosystem/arfleet.png";
import PermapagesIcon from "url:/assets/ecosystem/permapages.svg";
import AoTrendsIcon from "url:/assets/ecosystem/aotrends.png";
import GatherchatIcon from "url:/assets/ecosystem/gatherchat.png";
import WeavechatIcon from "url:/assets/ecosystem/weavechat.png";
import BodhiIcon from "url:/assets/ecosystem/bodhi.svg";
import ApusIcon from "url:/assets/ecosystem/apus.png";
import ArweaveCommunityIcon from "url:/assets/ecosystem/arweavecommunity.svg";
import BetterIdeaIcon from "url:/assets/ecosystem/betteridea.svg";
import ArweaveWalletKitIcon from "url:/assets/ecosystem/arweavewalletkit.svg";
import WeaveDBIcon from "url:/assets/ecosystem/weavedb.svg";
import AoClassicBlackJackIcon from "url:/assets/ecosystem/aoclassicblackjack.png";
import WeaveEVMIcon from "url:/assets/ecosystem/weaveevm.png";
import TauOracleIcon from "url:/assets/ecosystem/tauoracle.png";
import OrbitIcon from "url:/assets/ecosystem/orbit.svg";
import RedstoneIcon from "url:/assets/ecosystem/redstone.svg";
import ArioIcon from "url:/assets/ecosystem/ario.svg";
import PermaDAOIcon from "url:/assets/ecosystem/permadao.svg";
import WeaversIcon from "url:/assets/ecosystem/weavers.png";
import DataOSIcon from "url:/assets/ecosystem/dataos.svg";
import AoVestIcon from "url:/assets/ecosystem/aovest.svg";
import BasejumpIcon from "url:/assets/ecosystem/basejump.svg";
import StampProtocolIcon from "url:/assets/ecosystem/stampprotocol.png";
import VouchDAOIcon from "url:/assets/ecosystem/vouchdao.png";
import TrunkIcon from "url:/assets/ecosystem/trunk.png";
import AoctionHouseIcon from "url:/assets/ecosystem/aoctionhouse.png";
import CtrlPlayIcon from "url:/assets/ecosystem/ctrlplay.png";
import DecentraMindIcon from "url:/assets/ecosystem/decentramind.png";
import PetOrRektIcon from "url:/assets/ecosystem/pet-or-rekt.png";
import AolottoIcon from "url:/assets/ecosystem/aolotto.png";

export interface App {
  name: string;
  category:
    | ""
    | "DeFi"
    | "Bridge"
    | "Games"
    | "Decentralized AI"
    | "NFTs"
    | "Social"
    | "Storage"
    | "Explorers"
    | "Dev Tools"
    | "Community"
    | "Analytics";
  url: string;
  icon: string;
  useAppIconWrapper?: boolean;
  backgroundColor?: string;
  showBorder?: boolean;
  objectFit?: "contain" | "cover";
  imageSize?: string;
}

export const apps: App[] = [
  // DeFi
  {
    name: "LiquidOps",
    category: "DeFi",
    url: "https://liquidops.io/",
    icon: LiquidOpsIcon
  },
  {
    name: "Astro Labs",
    category: "DeFi",
    url: "https://www.astrousd.com/",
    icon: AstroIcon,
    objectFit: "cover"
  },
  {
    name: "Botega",
    category: "DeFi",
    url: "https://botega.arweave.net/",
    icon: BotegaIcon
  },
  {
    name: "Dexi",
    category: "DeFi",
    url: "https://dexi.arweave.net/",
    icon: DexiIcon
  },
  {
    name: "CoinMaker",
    category: "DeFi",
    url: "https://coin.arweave.net/",
    icon: CoinMakerIcon
  },
  {
    name: "Perplex",
    category: "DeFi",
    url: "https://perplex.finance/",
    icon: PerplexIcon
  },
  {
    name: "EverPay",
    category: "DeFi",
    url: "https://www.everpay.io/",
    icon: EverpayIcon
  },
  {
    name: "PermaSwap",
    category: "DeFi",
    url: "https://aopsn.com/",
    icon: PermaswapIcon
  },
  {
    name: "Outcome",
    category: "DeFi",
    url: "https://www.outcome.gg/",
    icon: OutcomeIcon
  },
  {
    name: "aoVest",
    category: "DeFi",
    url: "https://aovest.stream/",
    icon: AoVestIcon
  },
  {
    name: "Trunk",
    category: "DeFi",
    url: "https://trunkao.xyz",
    icon: TrunkIcon
  },

  // Bridges
  {
    name: "Quantum",
    category: "Bridge",
    url: "https://bridge.astrousd.com/",
    icon: QuantumIcon
  },
  {
    name: "AOX",
    category: "Bridge",
    url: "https://aox.xyz/",
    icon: AoxIcon
  },
  {
    name: "AO Mint",
    category: "Bridge",
    url: "https://ao.arweave.net/#/mint",
    icon: AoIcon
  },

  // Games
  {
    name: "Basejump",
    category: "Games",
    url: "https://www.basejump.xyz",
    icon: BasejumpIcon
  },
  {
    name: "Llama Land",
    category: "Games",
    url: "https://llamaland.arweave.net/",
    icon: LlamaLandIcon
  },
  {
    name: "Dumverse",
    category: "Games",
    url: "https://udatfq2ef3xeb7dgk2tw3ibgoelokcht4wuwirgocolve66xyfua.arweave.net/oMEyw0Qu7kD8ZlanbaAmcRblCPPlqWREzhOXUnvXwWg/",
    icon: DumverseIcon
  },
  {
    name: "Cyberbeavers",
    category: "Games",
    url: "https://beavers.warp.cc/",
    icon: CyberweaversIcon
  },
  {
    name: "DumDumUp!",
    category: "Games",
    url: "https://dumdumup.vercel.app/",
    icon: DumDumUpIcon
  },
  {
    name: "Hang Out",
    category: "Games",
    url: "https://hangout.aogames.org/",
    icon: HangoutIcon
  },
  {
    name: "AO Craft",
    category: "Games",
    url: "https://ao-craft.vercel.app/",
    icon: AoCraftIcon
  },
  {
    name: "AO War",
    category: "Games",
    url: "https://aowar.arweave.net/",
    icon: AoWarIcon
  },
  {
    name: "BazARmash",
    category: "Games",
    url: "https://bazarmash.vercel.app/",
    icon: BazarmashIcon
  },
  {
    name: "CasinAO",
    category: "Games",
    url: "https://agcpzmllwtabfgpx6szogbps2b2qcxpqolkzvpq7zu2rwpx5oosq.arweave.net/AYT8sWu0wBKZ9_Sy4wXy0HUBXfBy1Zq-H801Gz79c6U/",
    icon: CasinaoIcon
  },
  {
    name: "Happy Farm",
    category: "Games",
    url: "https://happytown.ar-io.net/",
    icon: HappyfarmIcon
  },
  {
    name: "DimensionLife",
    category: "Games",
    url: "https://ar.dimension-life.rootmud.xyz/",
    icon: DimensionlifeIcon
  },
  {
    name: "AO Classic Blackjack",
    category: "Games",
    url: "https://blackjack.arweave.net/",
    icon: AoClassicBlackJackIcon
  },
  {
    name: "Dum Dum Dum",
    category: "Games",
    url: "https://qtvgmiqdhqmjzpeajspzovhopa56egwi2e6njkdkrc44pyooqquq.arweave.net/hOpmIgM8GJy8gEyfl1TueDviGsjRPNSoaoi5x-HOhCk/",
    icon: DumdumDumIcon
  },
  {
    name: "Ctrl Play",
    category: "Games",
    url: "https://ctrlplayfrontend_arlink.arweave.net",
    icon: CtrlPlayIcon,
    useAppIconWrapper: true,
    backgroundColor: "#000000"
  },
  {
    name: "Pet or Rekt",
    category: "Games",
    url: "https://dumdum.arweave.net/",
    icon: PetOrRektIcon,
    useAppIconWrapper: true,
    backgroundColor: "#000000"
  },
  {
    name: "Aolotto",
    category: "Games",
    url: "https://aolotto.com",
    icon: AolottoIcon,
    showBorder: true,
    imageSize: "32px",
    backgroundColor: "#FFF"
  },

  // DeAI
  {
    name: "AOS-Llama",
    category: "Decentralized AI",
    url: "https://github.com/samcamwilliams/aos-llama",
    icon: AosLlamaIcon
  },
  {
    name: "Apus Network",
    category: "Decentralized AI",
    url: "https://www.apus.network/",
    icon: ApusIcon
  },

  // NFTs
  {
    name: "BazAR",
    category: "NFTs",
    url: "https://bazar.arweave.net/",
    icon: BazarIcon
  },
  {
    name: "AOction House",
    category: "NFTs",
    url: "https://1of1_aoction-house.arweave.net",
    icon: AoctionHouseIcon,
    imageSize: "32px",
    useAppIconWrapper: true
  },

  // Social
  // {
  //   name: "Odysee",
  //   category: "Social",
  //   url: "https://odysee.com/",
  //   icon: <OdyseeIcon />,
  // },
  {
    name: "Typr",
    category: "Social",
    url: "https://iamgamelover.arweave.net/",
    icon: TyprIcon
  },
  {
    name: "Bodhi",
    category: "Social",
    url: "https://bodhi.wtf/",
    icon: BodhiIcon
  },
  {
    name: "WeaveChat",
    category: "Social",
    url: "https://weavechat.vercel.app/",
    icon: WeavechatIcon
  },
  {
    name: "GatherChat",
    category: "Social",
    url: "https://gatherchat.ar-io.net/#/",
    icon: GatherchatIcon
  },
  {
    name: "Permapages",
    category: "Social",
    url: "https://permapages.app/",
    icon: PermapagesIcon
  },
  {
    name: "AO Trends",
    category: "Social",
    url: "https://trends_arlink.arweave.net/",
    icon: AoTrendsIcon
  },
  {
    name: "DecentraMind",
    category: "Social",
    url: "https://decentramind.club/",
    icon: DecentraMindIcon,
    useAppIconWrapper: true,
    backgroundColor: "#fff"
  },

  // Storage
  {
    name: "ArDrive",
    category: "Storage",
    url: "https://ardrive.io/",
    icon: ArDriveIcon,
    objectFit: "cover"
  },
  {
    name: "ArFleet",
    category: "Storage",
    url: "https://arfleet.arweave.net/#/",
    icon: ArfleetIcon
  },
  {
    name: "Alex",
    category: "Storage",
    url: "https://alex.arweave.net/",
    icon: AlexIcon
  },

  // Explorers
  {
    name: "AO Link",
    category: "Explorers",
    url: "https://www.ao.link/",
    icon: AolinkIcon
  },
  {
    name: "ViewBlock",
    category: "Explorers",
    url: "https://viewblock.io/arweave",
    icon: ViewblockIcon
  },

  // Dev Tools
  {
    name: "Protocol.Land",
    category: "Dev Tools",
    url: "https://protocol.land/",
    icon: ProtocolLandIcon
  },
  {
    name: "Ar.io",
    category: "Dev Tools",
    url: "https://ar.io/",
    icon: ArioIcon
  },
  {
    name: "ArNS",
    category: "Dev Tools",
    url: "https://ar.io/arns",
    icon: ArioIcon
  },
  {
    name: "Redstone",
    category: "Dev Tools",
    url: "https://redstone.finance/",
    icon: RedstoneIcon
  },
  {
    name: "Orbit",
    category: "Dev Tools",
    url: "https://0rbit.co/",
    icon: OrbitIcon
  },
  {
    name: "Tau Oracle",
    category: "Dev Tools",
    url: "https://tauoracle.com/",
    icon: TauOracleIcon
  },
  {
    name: "WeavEVM",
    category: "Dev Tools",
    url: "https://www.wvm.dev/",
    icon: WeaveEVMIcon
  },
  {
    name: "WeaveDB",
    category: "Dev Tools",
    url: "https://weavedb.dev/",
    icon: WeaveDBIcon
  },
  {
    name: "Arweave Wallet Kit",
    category: "Dev Tools",
    url: "https://docs.arweavekit.com/wallets/wallet-kit",
    icon: ArweaveWalletKitIcon
  },
  {
    name: "BetterIDEa",
    category: "Dev Tools",
    url: "https://betteridea.dev/",
    icon: BetterIdeaIcon
  },
  {
    name: "ArWiki",
    category: "Dev Tools",
    url: "https://arwiki.wiki",
    icon: ArweaveCommunityIcon
  },
  {
    name: "VouchDAO",
    category: "Dev Tools",
    url: "https://vouch-dao.arweave.net",
    icon: VouchDAOIcon,
    useAppIconWrapper: true
  },
  {
    name: "Stamp Protocol",
    category: "Dev Tools",
    url: "https://stamps.live/",
    icon: StampProtocolIcon,
    useAppIconWrapper: true
  },

  // Community
  {
    name: "Weavers",
    category: "Community",
    url: "https://www.weaversofficial.com/",
    icon: WeaversIcon
  },
  {
    name: "Longview Labs",
    category: "Community",
    url: "https://www.longviewlabs.co/",
    icon: LongviewLabsIcon
  },
  {
    name: "PermaDAO",
    category: "Community",
    url: "https://permadao.com/",
    icon: PermaDAOIcon
  },
  {
    name: "Arweave Oasis",
    category: "Community",
    url: "https://arweaveoasis.com/",
    icon: ArweaveOasisIcon
  },
  {
    name: "Arweave India",
    category: "Community",
    url: "https://www.arweaveindia.com/",
    icon: ArweaveCommunityIcon
  },
  {
    name: "Arweave Philippines",
    category: "Community",
    url: "https://linktr.ee/arweaveph",
    icon: ArweavePIIcon
  },
  {
    name: "Arweave Africa",
    category: "Community",
    url: "https://x.com/ArweaveAfrica",
    icon: ArweaveAfricaIcon
  },

  // Analytics
  {
    name: "DataOS",
    category: "Analytics",
    url: "https://stats.dataos.so/",
    icon: DataOSIcon
  }
];

export const categories = [
  { title: "All", icon: Grid01 },
  { title: "DeFi", icon: BankNote01 },
  { title: "Bridge", icon: Scales02 },
  { title: "Games", icon: GamingPad01 },
  { title: "Decentralized AI", icon: MessageSmileCircle },
  { title: "NFTs", icon: Image03 },
  { title: "Social", icon: ImageUser },
  { title: "Storage", icon: Server04 },
  { title: "Explorers", icon: Globe02 },
  { title: "Dev Tools", icon: CodeBrowser },
  { title: "Community", icon: Users03 },
  { title: "Analytics", icon: BarChartSquare01 }
];
