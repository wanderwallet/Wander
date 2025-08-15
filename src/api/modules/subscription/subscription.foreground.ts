import type { SubscriptionData } from "~subscriptions/subscription";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<SubscriptionData[]> = (data) => {
  // Validate required fields
  const requiredFields: (keyof SubscriptionData)[] = [
    "arweaveAccountAddress",
    "applicationName",
    "subscriptionName",
    "subscriptionFeeAmount",
    "recurringPaymentFrequency",
    "subscriptionManagementUrl",
    "subscriptionEndDate",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // optional fields
  const allFields = [...requiredFields, "applicationIcon"];

  Object.keys(data).forEach((key) => {
    if (!allFields.includes(key as keyof SubscriptionData)) {
      throw new Error(`Unexpected extra field: ${key}`);
    }
  });

  return [
    {
      ...data,
      applicationIcon: data.applicationIcon,
    },
  ];
};

export default foreground;
