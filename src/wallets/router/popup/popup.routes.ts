import { LoadingView } from "~components/page/common/loading/loading.view";
import { HomeView } from "~routes/popup";
import { CollectibleView } from "~routes/popup/collectible/[id]";
import { CollectiblesView } from "~routes/popup/collectibles";
import { ConfirmPurchaseView } from "~routes/popup/confirm";
import { MessageNotificationView } from "~routes/popup/notification/[id]";
import { PendingPurchaseView } from "~routes/popup/pending";
import { PurchaseView } from "~routes/popup/purchase";
import { ArNSPurchaseStartView } from "~routes/popup/arns/ArNSPurchaseStartView";
import { ArNSNameSearchView } from "~routes/popup/arns/ArNSNameSearchView";
import { ReceiveView } from "~routes/popup/receive";
import { SendView } from "~routes/popup/send";
import { AmountView } from "~routes/popup/send/amount";
import { SendAuthView } from "~routes/popup/send/auth";
import { TransactionCompletedView } from "~routes/popup/send/completed";
import { ConfirmView } from "~routes/popup/send/confirm";
import { ApplicationsView } from "~routes/popup/settings/apps";
import { AppSettingsView } from "~routes/popup/settings/apps/[url]";
import { AppPermissionsView } from "~routes/popup/settings/apps/[url]/permissions";
import { ContactsView } from "~routes/popup/settings/contacts";
import { ContactSettingsView } from "~routes/popup/settings/contacts/[address]";
import { NewContactView } from "~routes/popup/settings/contacts/new";
import { NotificationSettingsView } from "~routes/popup/settings/notifications";
import { MenuView } from "~routes/popup/settings";
import { TokensSettingsView } from "~routes/popup/settings/tokens";
import { TokenSettingsView } from "~routes/popup/settings/tokens/[id]";
import { NewTokenSettingsView } from "~routes/popup/settings/tokens/new";
import { WalletsView } from "~routes/popup/settings/wallets";
import { WalletView } from "~routes/popup/settings/wallets/[address]";
import { ExportWalletView } from "~routes/popup/settings/wallets/[address]/export";
import { GenerateQRView } from "~routes/popup/settings/wallets/[address]/qr";
import { SubscriptionDetailsView } from "~routes/popup/subscriptions/subscriptionDetails";
import { SubscriptionManagementView } from "~routes/popup/subscriptions/subscriptionManagement";
import { SubscriptionPaymentView } from "~routes/popup/subscriptions/subscriptionPayment";
import { SubscriptionsView } from "~routes/popup/subscriptions/subscriptions";
import { TransactionView } from "~routes/popup/transaction/[id]";
import { TransactionsView } from "~routes/popup/transaction/transactions";
import { UnlockView } from "~routes/popup/unlock";
import { getExtensionOverrides } from "~wallets/router/extension/extension.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { NoteView } from "~routes/popup/send/note";
import { WelcomePaths } from "../welcome/welcome.routes";
import { GettingStartedSetupWelcomeView } from "~routes/popup/gettingStarted";
import { RecoveryPhraseView } from "~routes/popup/settings/wallets/[address]/recovery-phrase";
import { AgentsView } from "~routes/popup/agents";
import { CreateAOYieldAgentView } from "~routes/popup/agents/ao-yield/create-agent";
import { ConfirmAOYieldAgentView } from "~routes/popup/agents/ao-yield/confirm-agent";
import { AOYieldAgentActivatedView } from "~routes/popup/agents/ao-yield/agent-activated";
import { ManageAOYieldAgentView } from "~routes/popup/agents/ao-yield/manage-agent";
import { EditAOYieldAgentView } from "~routes/popup/agents/ao-yield/edit-agent";
import { AOYieldAgentHistoryView } from "~routes/popup/agents/ao-yield/agent-history";
import { AOYieldAgentInfoView } from "~routes/popup/agents/ao-yield/agent-info";
import { AOYieldAgentTransactionHistoryView } from "~routes/popup/agents/ao-yield/agent-transaction-history";
import { LiquidOpsAgentsView } from "~routes/popup/agents/liquidops/agents";
import { LiquidOpsAgent } from "~routes/popup/agents/liquidops/agent";
import { LiquidOpsDepositWithdraw } from "~routes/popup/agents/liquidops/depositwithdraw";
import { LiquidOpsConfirm } from "~routes/popup/agents/liquidops/confirm";
import { LiquidOpsResult } from "~routes/popup/agents/liquidops/result";
import { AnnouncementView } from "~routes/popup/announcement";
import { TierView } from "~routes/popup/tier";
import { EarnView } from "~routes/popup/earn";
import { ManageEarningsView } from "~routes/popup/earn/manage";
import { AllocationSetView } from "~routes/popup/earn/allocation-set";
import { TokensView } from "~routes/popup/tokens";
import { TokenDetailView } from "~routes/popup/tokens/token-detail";
import { HelpView } from "~routes/popup/settings/help";
import { ArNSNamePurchaseView } from "~routes/popup/arns/ArNSNamePurchaseView";
import { ArNSConfirmPurchaseView } from "~routes/popup/arns/ArNSConfirmPurchaseView";
import { ArNSPurchaseSuccessView } from "~routes/popup/arns/ArNSPurchaseSuccessView";

export type PopupRoutePath =
  | "/"
  | `/purchase`
  | `/confirm-purchase/${string}`
  | `/purchase-pending`
  | `/receive`
  | `/send/transfer`
  | `/send/transfer/${string}`
  | `/send/amount/${string}/${string}`
  | `/send/auth/${string}`
  | `/send/note`
  | `/explore`
  | `/subscriptions`
  | `/subscriptions/${string}`
  | `/subscriptions/${string}/manage`
  | `/subscriptions/${string}/payment`
  | `/transactions`
  | `/notifications`
  | `/notification/${string}`
  | `/tokens`
  | `/tokens/${string}`
  | `/collectibles`
  | `/collectible/${string}`
  | `/transaction/${string}`
  | `/transaction/${string}/${string}`
  | `/announcement/${string}`
  | `/send/confirm/${string}/${string}/${string}`
  | `/send/confirm/${string}/${string}/${string}/${string}`
  | `/send/completed/${string}`
  | `/quick-settings`
  | `/quick-settings/wallets`
  | `/quick-settings/wallets/${string}`
  | `/quick-settings/wallets/${string}/export`
  | `/quick-settings/wallets/${string}/qr`
  | `/quick-settings/apps`
  | `/quick-settings/apps/${string}`
  | `/quick-settings/apps/${string}/permissions`
  | `/quick-settings/tokens`
  | `/quick-settings/tokens/new`
  | `/quick-settings/tokens/${string}`
  | `/quick-settings/contacts`
  | `/quick-settings/contacts/new`
  | `/quick-settings/contacts/${string}`
  | `/quick-settings/notifications`
  | `/quick-settings/help`
  | `/getting-started/${string}`
  | `/agents`
  | `/agents/ao-yield/create-agent`
  | `/agents/ao-yield/confirm-agent`
  | `/agents/ao-yield/manage-agent`
  | `/agents/ao-yield/edit-agent`
  | `/agents/ao-yield/activated`
  | `/agents/ao-yield/history`
  | `/agents/ao-yield/info/${string}`
  | `/agents/ao-yield/transaction-history/${string}`
  | `/agents/liquidops/agents`
  | `/agents/liquidops/${string}`
  | `/agents/liquidops/${string}/${"deposit" | "withdraw"}`
  | `/agents/liquidops/${string}/${"deposit" | "withdraw"}/${string}/confirm`
  | `/agents/liquidops/${string}/${"deposit" | "withdraw"}/result/${"success" | "failure"}`
  | `/tier`
  | `/earn`
  | `/earn/manage`
  | `/earn/allocation-set`
  | `/arns-purchase-start`
  | `/arns`
  | `/arns/purchase-name-search`
  | `/arns/purchase-name/${string}`
  | `/arns/confirm-purchase/${string}/${string}/${string}`
  | `/arns/purchase-success/${string}/${string}/${string}/${string}`;

export const PopupPaths = {
  Home: "/",
  Purchase: "/purchase",
  ArNSPurchaseStart: "/arns",
  ArNSPurchaseNameSearch: "/arns/purchase-name-search",
  ArNSPurchaseName: "/arns/purchase-name/:name",
  ArNSConfirmPurchase: "/arns/confirm-purchase/:name/:purchaseType/:purchaseYears?",
  ArNSPurchaseSuccess: "/arns/purchase-success/:name/:purchaseType/:purchaseYears/:transactionId",
  ConfirmPurchase: "/confirm-purchase/:quoteId?",
  PendingPurchase: "/purchase-pending",
  Receive: "/receive",
  Send: "/send/transfer/:id?",
  Amount: "/send/amount/:recipient/:id?",
  Note: "/send/note",
  SendAuth: "/send/auth/:tokenID?",
  Subscriptions: "/subscriptions",
  SubscriptionDetails: "/subscriptions/:id",
  SubscriptionManagement: "/subscriptions/:id/manage",
  SubscriptionPayment: "/subscriptions/:id/payment",
  Transactions: "/transactions",
  Notifications: "/notifications",
  MessageNotification: "/notification/:id",
  Tokens: "/tokens",
  TokenDetail: "/tokens/:id",
  Collectibles: "/collectibles",
  Collectible: "/collectible/:id",
  Transaction: "/transaction/:id/:gateway?",
  Announcement: "/announcement/:id",
  Confirm: "/send/confirm/:token/:qty/:recipient/:message?",
  TransactionCompleted: "/send/completed/:id",
  QuickSettings: "/quick-settings",
  Wallets: "/quick-settings/wallets",
  Wallet: "/quick-settings/wallets/:address",
  ExportWallet: "/quick-settings/wallets/:address/export",
  GenerateQR: "/quick-settings/wallets/:address/qr",
  RecoveryPhrase: "/quick-settings/wallets/:address/recovery-phrase",
  Applications: "/quick-settings/apps",
  AppSettings: "/quick-settings/apps/:url",
  AppPermissions: "/quick-settings/apps/:url/permissions",
  TokensSettings: "/quick-settings/tokens",
  NewTokenSettings: "/quick-settings/tokens/new",
  TokenSettings: "/quick-settings/tokens/:id",
  Contacts: "/quick-settings/contacts",
  NewContact: "/quick-settings/contacts/new",
  ContactSettings: "/quick-settings/contacts/:address",
  NotificationSettings: "/quick-settings/notifications",
  Help: "/quick-settings/help",
  Agents: "/agents",
  CreateAOYieldAgent: "/agents/ao-yield/create-agent",
  ConfirmAOYieldAgent: "/agents/ao-yield/confirm-agent",
  ManageAOYieldAgent: "/agents/ao-yield/manage-agent",
  EditAOYieldAgent: "/agents/ao-yield/edit-agent",
  AOYieldAgentActivated: "/agents/ao-yield/activated",
  AOYieldAgentHistory: "/agents/ao-yield/history",
  AOYieldAgentInfo: "/agents/ao-yield/info/:id",
  AOYieldAgentTransactionHistory: "/agents/ao-yield/transaction-history/:id",
  LiquidOpsAgentsList: "/agents/liquidops/agents",
  LiquidOpsAgent: "/agents/liquidops/:ticker",
  LiquidOpsDepositWithdraw: "/agents/liquidops/:ticker/:action",
  LiquidOpsResult: "/agents/liquidops/:ticker/:action/result/:result",
  LiquidOpsConfirm: "/agents/liquidops/:ticker/:action/:quantity/confirm",
  Tier: "/tier",
  Earn: "/earn",
  ManageEarnings: "/earn/manage",
  AllocationSet: "/earn/allocation-set",
} as const satisfies Record<string, PopupRoutePath>;

export const POPUP_ROUTES = [
  ...getExtensionOverrides({
    unlockView: UnlockView,
    loadingView: LoadingView,
  }),
  {
    path: PopupPaths.Home,
    component: HomeView,
  },
  {
    path: PopupPaths.Purchase,
    component: PurchaseView,
  },
  {
    path: PopupPaths.ConfirmPurchase,
    component: ConfirmPurchaseView,
  },
  {
    path: PopupPaths.PendingPurchase,
    component: PendingPurchaseView,
  },
  {
    path: PopupPaths.Receive,
    component: ReceiveView,
  },
  {
    path: PopupPaths.Send,
    component: SendView,
  },
  {
    path: PopupPaths.Amount,
    component: AmountView,
  },
  {
    path: PopupPaths.Note,
    component: NoteView,
  },
  {
    path: PopupPaths.SendAuth,
    component: SendAuthView,
  },
  {
    path: PopupPaths.Subscriptions,
    component: SubscriptionsView,
  },
  {
    path: PopupPaths.SubscriptionDetails,
    component: SubscriptionDetailsView,
  },
  {
    path: PopupPaths.SubscriptionManagement,
    component: SubscriptionManagementView,
  },
  {
    path: PopupPaths.SubscriptionPayment,
    component: SubscriptionPaymentView,
  },
  {
    path: PopupPaths.Transactions,
    component: TransactionsView,
  },
  {
    path: PopupPaths.MessageNotification,
    component: MessageNotificationView,
  },
  {
    path: PopupPaths.Tokens,
    component: TokensView,
  },
  {
    path: PopupPaths.TokenDetail,
    component: TokenDetailView,
  },
  {
    path: PopupPaths.Collectibles,
    component: CollectiblesView,
  },
  {
    path: PopupPaths.Collectible,
    component: CollectibleView,
  },
  {
    path: PopupPaths.Transaction,
    component: TransactionView,
  },
  {
    path: PopupPaths.Announcement,
    component: AnnouncementView,
  },
  {
    // TODO: This route is incorrect/misleading as a lot of its params are actually ignored and loaded from a temp tx
    // stored in the temp storage:
    path: PopupPaths.Confirm,
    component: ConfirmView,
  },
  {
    path: PopupPaths.TransactionCompleted,
    component: TransactionCompletedView,
  },
  {
    path: PopupPaths.QuickSettings,
    component: MenuView,
  },
  {
    path: PopupPaths.Wallets,
    component: WalletsView,
  },
  {
    path: PopupPaths.Wallet,
    component: WalletView,
  },
  {
    path: PopupPaths.ExportWallet,
    component: ExportWalletView,
  },
  {
    path: PopupPaths.GenerateQR,
    component: GenerateQRView,
  },
  {
    path: PopupPaths.RecoveryPhrase,
    component: RecoveryPhraseView,
  },
  {
    path: PopupPaths.Applications,
    component: ApplicationsView,
  },
  {
    path: PopupPaths.AppSettings,
    component: AppSettingsView,
  },
  {
    path: PopupPaths.AppPermissions,
    component: AppPermissionsView,
  },
  {
    path: PopupPaths.TokensSettings,
    component: TokensSettingsView,
  },
  {
    path: PopupPaths.NewTokenSettings,
    component: NewTokenSettingsView,
  },
  {
    path: PopupPaths.TokenSettings,
    component: TokenSettingsView,
  },
  {
    path: PopupPaths.Contacts,
    component: ContactsView,
  },
  {
    path: PopupPaths.NewContact,
    component: NewContactView,
  },
  {
    path: PopupPaths.ContactSettings,
    component: ContactSettingsView,
  },
  {
    path: PopupPaths.NotificationSettings,
    component: NotificationSettingsView,
  },
  {
    path: PopupPaths.Help,
    component: HelpView,
  },
  {
    path: WelcomePaths.GettingStarted,
    component: GettingStartedSetupWelcomeView,
  },
  {
    path: PopupPaths.Agents,
    component: AgentsView,
  },
  {
    path: PopupPaths.CreateAOYieldAgent,
    component: CreateAOYieldAgentView,
  },
  {
    path: PopupPaths.ConfirmAOYieldAgent,
    component: ConfirmAOYieldAgentView,
  },
  {
    path: PopupPaths.ManageAOYieldAgent,
    component: ManageAOYieldAgentView,
  },
  {
    path: PopupPaths.EditAOYieldAgent,
    component: EditAOYieldAgentView,
  },
  {
    path: PopupPaths.AOYieldAgentActivated,
    component: AOYieldAgentActivatedView,
  },
  {
    path: PopupPaths.AOYieldAgentHistory,
    component: AOYieldAgentHistoryView,
  },
  {
    path: PopupPaths.AOYieldAgentInfo,
    component: AOYieldAgentInfoView,
  },
  {
    path: PopupPaths.AOYieldAgentTransactionHistory,
    component: AOYieldAgentTransactionHistoryView,
  },
  {
    path: PopupPaths.LiquidOpsAgentsList,
    component: LiquidOpsAgentsView,
  },
  {
    path: PopupPaths.LiquidOpsAgent,
    component: LiquidOpsAgent,
  },
  {
    path: PopupPaths.LiquidOpsDepositWithdraw,
    component: LiquidOpsDepositWithdraw,
  },
  {
    path: PopupPaths.LiquidOpsResult,
    component: LiquidOpsResult,
  },
  {
    path: PopupPaths.LiquidOpsConfirm,
    component: LiquidOpsConfirm,
  },
  {
    path: PopupPaths.Tier,
    component: TierView,
  },
  {
    path: PopupPaths.Earn,
    component: EarnView,
  },
  {
    path: PopupPaths.ManageEarnings,
    component: ManageEarningsView,
  },
  {
    path: PopupPaths.AllocationSet,
    component: AllocationSetView,
  },
  {
    path: PopupPaths.ArNSPurchaseStart,
    component: ArNSPurchaseStartView,
  },
  {
    path: PopupPaths.ArNSPurchaseNameSearch,
    component: ArNSNameSearchView,
  },
  {
    path: PopupPaths.ArNSPurchaseName,
    component: ArNSNamePurchaseView,
  },
  {
    path: PopupPaths.ArNSConfirmPurchase,
    component: ArNSConfirmPurchaseView,
  },
  {
    path: PopupPaths.ArNSPurchaseSuccess,
    component: ArNSPurchaseSuccessView,
  },
] as const satisfies RouteConfig[];
