import { getActiveAddress, getActiveKeyfile } from "~wallets";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { Alarms } from "webextension-polyfill";
import { findGateway } from "~gateways/wayfinder";
import { getArPrice } from "~lib/coingecko";
import { getSetting } from "~settings";
import { concatGatewayURL } from "~gateways/utils";
import { gql } from "~gateways/api";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave/web/common";
import BigNumber from "bignumber.js";
//import redstone from "redstone-api";

/**
 * Handle fee tx creation event using alarms
 */
export default async function handleFeeAlarm(alarmInfo: Alarms.Alarm) {
  if (!alarmInfo.name.startsWith("scheduled-fee.")) return;

  // client and tx info
  const [, linkedTransaction, appURL] = alarmInfo.name.split(".");
  const arweave = new Arweave(await findGateway({}));

  // fee multiplier
  const feeMultiplier =
    (await getSetting("fee_multiplier").getValue<number>()) || 1;

  // get wallet and address
  const wallet = await getActiveKeyfile();
  const address = await getActiveAddress();

  // only charge fee from local wallets
  if (wallet.type === "hardware") {
    return;
  }

  const keyfile = wallet.keyfile;

  // attempt to create fee
  try {
    const feeTarget = await selectVRTHolder();

    if (feeTarget) {
      const feeTx = await arweave.createTransaction(
        {
          target: feeTarget,
          quantity: await getFeeAmount(address, new Application(appURL))
        },
        keyfile
      );

      feeTx.addTag("App-Name", "Wander");
      feeTx.addTag("App-Version", browser.runtime.getManifest().version);
      feeTx.addTag("Type", "Fee-Transaction");
      feeTx.addTag("Linked-Transaction", linkedTransaction);

      // fee multiplication
      if (feeMultiplier > 1) {
        feeTx.reward = BigNumber(feeTx.reward)
          .multipliedBy(feeMultiplier)
          .toFixed(0, BigNumber.ROUND_FLOOR);
      }

      await arweave.transactions.sign(feeTx, keyfile);

      const uploader = await arweave.transactions.getUploader(feeTx);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }
    }
  } catch (e) {
    console.log(
      `Unable to create fee for transaction "${linkedTransaction}"`,
      e
    );
  }

  // remove wallet from memory
  freeDecryptedWallet(keyfile);
}

/**
 * Select a random holder from the weighted list of VRT holders
 */
async function selectVRTHolder() {
  try {
    const vrtContractID = "usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A";
    const state = await (
      await fetch(
        `https://storage.googleapis.com/verto-exchange-contracts/${vrtContractID}/${vrtContractID}_state.json`
      )
    ).json();

    if (!state) return undefined;

    const balances = state.balances;
    const vault = state.vault;
    let totalTokens = 0;

    for (const addr of Object.keys(balances)) {
      totalTokens += balances[addr];
    }

    for (const addr of Object.keys(vault)) {
      if (!vault[addr].length) continue;

      const vaultBalance = vault[addr]
        // @ts-ignore
        .map((a) => a.balance)
        // @ts-ignore
        .reduce((a, b) => a + b, 0);
      totalTokens += vaultBalance;

      if (addr in balances) balances[addr] += vaultBalance;
      else balances[addr] = vaultBalance;
    }

    const weighted: { [addr: string]: number } = {};

    for (const addr of Object.keys(balances)) {
      weighted[addr] = balances[addr] / totalTokens;
    }

    let sum = 0;
    const r = Math.random();

    for (const addr of Object.keys(weighted)) {
      sum += weighted[addr];

      if (r <= sum && weighted[addr] > 0) {
        return addr;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Calculate the fee amount needed for a signing
 *
 * @param address The address to base off the calculation
 * @param arweave Arweave client
 *
 * @returns Fee amount in string
 */
export async function getFeeAmount(address: string, app: Application) {
  const res = await gql(
    `
      query($address: String!) {
        transactions(
          owners: [$address]
          tags: [
            { name: "App-Name", values: "Wander" }
            { name: "Type", values: "Fee-Transaction" }
          ]
          first: 11
        ) {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
    { address },
    await app.getGatewayConfig()
  );

  const arweave = new Arweave(await findGateway({ graphql: true }));
  /*let arPrice = 0;

  try {
    // grab price from redstone API
    const { value } = await redstone.getPrice("AR");

    arPrice = value;
  } catch {
    // fallback price API
    const { data: res }: any = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
    );
    arPrice = res.arweave.usd;
  }*/
  const arPrice = await getArPrice("usd");
  const usdPrice = BigNumber(1).dividedBy(arPrice); // 1 USD how much AR

  if (res.data.transactions.edges.length) {
    const usd = res.data.transactions.edges.length >= 10 ? 0.01 : 0.03;

    return arweave.ar.arToWinston(usdPrice.multipliedBy(usd).toString());
  } else return arweave.ar.arToWinston(usdPrice.multipliedBy(0.01).toString());
}

/**
 * Get Arweave transaction anchor
 */
async function arApi(path: string, gateway: Gateway) {
  const res = await (
    await fetch(`${concatGatewayURL(gateway)}/${path}`)
  ).text();

  return res;
}
