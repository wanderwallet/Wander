import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { getSetting, PREFIX } from "~settings";

const useSetting = <T = any>(name: string) => {
  const setting = getSetting(name);
  const hook = useStorage<T>(
    {
      key: `${PREFIX}${name}`,
      instance: ExtensionStorage
    },
    (val) => (!isSettingUnset(val) ? val : (setting.defaultValue as T))
  );

  return hook;
};

const isSettingUnset = (val: unknown) =>
  typeof val === "undefined" || val === null;

export default useSetting;
