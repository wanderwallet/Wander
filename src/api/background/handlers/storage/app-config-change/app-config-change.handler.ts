import type { StorageChange } from "~utils/runtime";
import { getStoredApps } from "~applications";
import { getAppURL } from "~utils/format";
import type { Event } from "shim";
import { getMissingPermissions } from "~applications/permissions";
import { forEachTab } from "~applications/tab";
import { compareGateways } from "~gateways/utils";
import type { InitAppParams } from "~applications/application";
import Application, { PREFIX } from "~applications/application";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";

export async function handleAppConfigChange(
  changes: Record<string, StorageChange<InitAppParams>>,
  areaName: string
) {
  // only trigger for storage.local
  if (areaName !== "local") return;

  // get connected apps
  const storedApps = await getStoredApps();

  // events to push
  const events: {
    appURL: string;
    event: Event;
  }[] = [];

  // iterate through changes
  for (const key in changes) {
    // continue if not an app config change and
    // if the app is added to the stored apps

    if (
      !key.startsWith(PREFIX) ||
      !storedApps.includes(key.replace(PREFIX, ""))
    )
      continue;

    // get values and app
    const { oldValue: storedOldValue, newValue: storedNewValue } = changes[key];
    const appURL = key.replace(PREFIX, "");
    const app = new Application(appURL);
    // this was changed by atticus because values in storage are stored stringified
    const oldValue = JSON.parse(
      (storedOldValue || "{}") as unknown as string
    ) as InitAppParams;
    const newValue = JSON.parse(
      (storedNewValue || "{}") as unknown as string
    ) as InitAppParams;

    // check if permission event emitting is needed
    // get missing permissions
    const missingPermissions = getMissingPermissions(
      oldValue?.permissions || [],
      newValue?.permissions || []
    );

    if (
      oldValue?.permissions?.length !== newValue?.permissions?.length ||
      missingPermissions.length > 0
    ) {
      events.push({
        appURL,
        event: {
          name: "permissions",
          value: newValue?.permissions || []
        }
      });
    }

    // check if gateway event emiting is needed
    const { result: hasGwPermission } = await app.hasPermissions([
      "ACCESS_ARWEAVE_CONFIG"
    ]);

    // compare gateway objects

    if (
      !compareGateways(oldValue?.gateway || {}, newValue?.gateway || {}) &&
      hasGwPermission
    ) {
      events.push({
        appURL,
        event: {
          name: "gateway",
          value: newValue?.gateway
        }
      });
    }
  }

  // TODO: Update this to work with Embedded:

  // send permissions to the appropriate tab
  await forEachTab(async (tab) => {
    // return if no tab url is present
    if (!tab?.url || !tab?.id) return;

    // filter events needed to be sent to the tab
    const eventsForTab = events
      .filter(({ appURL }) => getAppURL(tab.url) === appURL)
      .map((e) => e.event);

    // send the events
    for (const event of eventsForTab) {
      // trigger emiter
      // TODO: Remove this await here
      await isomorphicSendMessage({
        destination: `content-script@${tab.id}`,
        messageId: "event",
        data: event
      });
    }
  });
}
