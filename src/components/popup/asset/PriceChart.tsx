import { ArrowDownRightIcon, ArrowUpRightIcon } from "@iconicicons/react";
import { Spacer, Text } from "@arconnect/components";
import { type PropsWithChildren, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import TokenLoading from "./Loading";
import cmcLogo from "url:/assets/ecosystem/coinmarketcap.svg";
import Graph from "../Graph";
import { formatFiatBalance } from "~tokens/currency";

export default function PriceChart({
  children,
  token,
  priceData,
  latestPrice,
  loading = false,
}: PropsWithChildren<Props>) {
  // price trend
  const positiveTrend = useMemo(() => {
    if (latestPrice === 0 || priceData.length === 0 || !latestPrice) {
      return undefined;
    }

    return latestPrice > priceData[0];
  }, [latestPrice, priceData]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  return (
    <Graph
      actionBar={(latestPrice && children) || <></>}
      data={(priceData.length !== 0 && priceData) || defaultPrices}
      blur={priceData.length === 0}>
      <AnimatePresence>{loading && <PriceLoading />}</AnimatePresence>
      <Head>
        <TokenName>
          {token.name}
          {token.ticker && <TokenTicker>{token.ticker}</TokenTicker>}
        </TokenName>
        {token.logo ? (
          <Logo src={token.logo} />
        ) : (
          <CoinMarketCap
            onClick={() =>
              browser.tabs.create({
                url: "https://coinmarketcap.com/currencies/arweave/",
              })
            }>
            <img src={cmcLogo} alt={"coinmarketcap"} />
          </CoinMarketCap>
        )}
      </Head>
      <Spacer y={0.15} />
      {(latestPrice !== 0 && latestPrice && (
        <TokenPrice>
          {formatFiatBalance(latestPrice, currency.toLowerCase())}
          {positiveTrend !== undefined &&
            (positiveTrend ? <PriceTrendPositive /> : <PriceTrendNegative as={ArrowDownRightIcon} />)}
        </TokenPrice>
      )) || <TokenPrice style={{ opacity: 0.7 }}>{browser.i18n.getMessage("no_price")}</TokenPrice>}
    </Graph>
  );
}

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CoinMarketCap = styled.a`
  cursor: pointer;

  img {
    width: 30px;
    height: 30px;
    draggable: false;
  }
`;

const TokenName = styled(Text).attrs({
  title: true,
  noMargin: true,
})`
  color: #fff;
  display: flex;
  align-items: baseline;
  gap: 0.36rem;
  font-size: 2.3rem;
  font-weight: 600;
  line-height: 1.1em;
`;

const TokenTicker = styled(Text).attrs({
  noMargin: true,
})`
  font-size: 0.6em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1em;
`;

const Logo = styled.img.attrs({
  draggable: false,
})`
  height: 2.1rem;
  user-select: none;
`;

const TokenPrice = styled(Text).attrs({
  noMargin: true,
})`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.9rem;
  color: #fff;
`;

const PriceTrendPositive = styled(ArrowUpRightIcon)`
  font-size: 0.82rem;
  width: 1em;
  height: 1em;
  color: #14d110;
`;

const PriceTrendNegative = styled(PriceTrendPositive)`
  color: #ff0000;
`;

const PriceLoading = styled(TokenLoading)`
  position: absolute;
  bottom: unset;
  top: 35%;
  right: 1.5rem;
`;

interface Props {
  priceData: number[];
  latestPrice?: number;
  token: {
    name: string;
    ticker?: string;
    logo?: string;
  };
  loading?: boolean;
}

const defaultPrices = [
  9.497418978821587, 9.115956391025087, 9.093960051241067, 9.140639061687326, 9.211786618107414, 9.252150005996823,
  9.362480980219887, 9.99723605035575, 10.513404292910428, 10.165780235337932, 10.141545181261693, 10.048424181280925,
  9.980708051670439, 9.8300226732424, 9.783610080244726, 9.652043080202288, 9.604236665512751, 9.576874266048867,
  9.60028577590853, 9.72209778120532, 9.668821177264489, 9.527851224592633, 9.446449371797828, 9.483552003738144,
  9.488196926238196, 9.435060212654168, 9.324506755465729, 9.347861336513015, 9.342429401526758, 9.360316396068857,
  9.461415615571854, 9.563079655560138, 9.538096966048283, 9.455557533503423, 9.428252646833387, 9.39854745967488,
  9.571527536689137, 9.619450535516645, 9.795794637731449, 9.895348998773898, 9.88025598674873, 9.877607858063332,
  9.981019340006085, 9.885065541376484, 9.78531185994097, 9.79672695798206, 9.82786650920884, 9.910150752056493,
  9.872257360476913, 9.85084890920811, 9.833940611046177, 9.885306114467094, 9.979335317187916, 10.03842813260851,
  9.927391948654794, 10.217113888857874, 10.096652854335337, 10.21717109953717, 10.242427786817494, 10.171173359815178,
  10.307069906978032, 10.17482789455683, 10.090868045908241, 9.937957067794898, 9.99091925030012, 9.976239204626419,
  9.962142196852517, 10.049302627570412, 10.028145440700472, 10.0043841267484, 10.074509092069142, 10.083404869591934,
  10.02374739466455, 10.051125061523898, 10.032605040369228, 10.14737355569501, 10.149760467215435, 10.165595383290366,
  10.245273541575104, 10.11393277119861, 10.070985942041302, 10.031547135998363, 9.943337609732106, 9.932608496376563,
  9.8532592869952, 9.862834627500042, 9.892467791085592, 9.951157562354696, 9.959292106339369, 10.00266402045068,
  10.05143111608497, 10.09844335527061, 10.131903699006992, 10.093745694811705, 10.321800880630844, 10.424299337307346,
  10.420721166957268, 10.42832473722916, 10.421186057594285, 10.348760956495482, 10.375533139045402, 10.44512280752976,
  10.410750426226581, 10.940266141640306, 11.095426321634122, 10.881225214139045, 10.652378736110775,
  10.586452296290485, 10.448798335735672, 10.399672775944275, 10.447641020552464, 10.249299843434908,
  10.140311590641211, 10.187249023518465, 10.026254067917685, 10.03152221697771, 9.944383019236763, 10.043761758982937,
  10.048825033109344, 9.977205971786892, 9.884466230234766, 9.814021694292268, 9.749093963701759, 9.691858989825562,
  9.536046794678699, 9.47727124345526, 9.45701937598359, 9.456647866301994, 9.3514113640767, 9.198879283369521,
  9.33395182944103, 9.377013511534477, 9.515147178662703, 9.626860846661364, 9.582591538829524, 9.528156483893254,
  9.595668867777778, 9.48021473457866, 9.321502790829932, 9.395437973487383, 9.380837485837596, 9.300865624714664,
  9.228245302299559, 9.163975625793524, 9.003522978021847, 9.01939409232304, 8.945512559623673, 9.038024134984255,
  9.01816884819072, 9.031708053928122, 9.158744167857963, 9.0106782593795, 9.074085207091443, 9.04379652113858,
  9.041106099104706, 9.041106099104706, 9.04268970890406, 9.034728402909595, 8.908558727495015, 8.829625145090539,
  8.808019305735652, 8.757646226429603, 8.663633929945053, 8.78815502623402, 8.797195640323345, 8.892757342697529,
  9.222801025921102, 9.062958732222603, 9.17668801641702, 9.127406067625905, 9.060046038783318,
];
