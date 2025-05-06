import BigNumber from "bignumber.js";
import { gql } from "~gateways/api";
import { suggestedGateways } from "~gateways/gateway";
import { combineAndSortTransactions, processTransactions } from "~notifications/utils";
import { ExtensionStorage } from "~utils/storage";

export type RawTransaction = {
  node: {
    id: string;
    recipient: string;
    owner: {
      address: string;
    };
    quantity: {
      ar: string;
    };
    block: {
      timestamp: number;
      height: number;
    };
    tags: Array<{
      name: string;
      value: string;
    }>;
  };
};

export type Transaction = RawTransaction & {
  transactionType: string;
  quantity: string;
  isAo?: boolean;
  tokenId?: string;
  warpContract?: boolean;
};

type ArNotificationsHandlerReturnType = [Transaction[], number, any[]];

export async function arNotificationsHandler(
  address: string,
  lastStoredHeight: number,
  notificationSetting: boolean,
  queriesConfig: {
    query: string;
    variables: Record<string, any>;
    isAllTxns?: boolean;
  }[],
): Promise<ArNotificationsHandlerReturnType> {
  try {
    let transactionDiff = [];

    const queries = queriesConfig.map((config) => gql(config.query, config.variables, suggestedGateways[1]));
    let responses = await Promise.all(queries);
    responses = responses.map((response, index) => {
      if (typeof queriesConfig[index].isAllTxns === "boolean" && !queriesConfig[index].isAllTxns) {
        response.data.transactions.edges = response.data.transactions.edges.filter((edge) =>
          BigNumber(edge.node.quantity.ar).gt(0),
        );
      }
      return response;
    });

    const combinedTransactions = combineAndSortTransactions(responses);

    const enrichedTransactions = processTransactions(combinedTransactions, address);

    const newMaxHeight = Math.max(
      ...enrichedTransactions
        .filter((tx) => tx.node.block) // Filter out transactions without a block
        .map((tx) => tx.node.block.height),
    );
    // filters out transactions that are older than last stored height,
    if (newMaxHeight !== lastStoredHeight) {
      const newTransactions = enrichedTransactions.filter(
        (transaction) => transaction.node.block && transaction.node.block.height > lastStoredHeight,
      );

      // if it's the first time loading notifications, don't send a message && notifications are enabled
      if (lastStoredHeight !== 0 && notificationSetting) {
        await ExtensionStorage.set("new_notifications", true);
        transactionDiff = newTransactions;
      }
    }
    return [enrichedTransactions, newMaxHeight, transactionDiff];
  } catch (err) {
    console.log("err", err);
  }
}
