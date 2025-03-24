import enDic from "url:/assets/_locales/en/messages.json";
import zhCnDic from "url:/assets/_locales/zh_CN/messages.json";

const dictionaries = {
  en: enDic as unknown as Record<
    string,
    { message: string; description: string }
  >,
  "zh-CN": zhCnDic as unknown as Record<
    string,
    { message: string; description: string }
  >
} as const;

export const i18n = {
  getMessage: (key: string, paramValues: string[] = []) => {
    const dictionaryLanguage =
      navigator.languages.find((language) => {
        return dictionaries.hasOwnProperty(language);
      }) || "en";

    const dictionary = dictionaries[dictionaryLanguage];

    let value = dictionary[key]?.message;

    if (!value) {
      console.warn(`Missing "${dictionaryLanguage}" translation for "${key}".`);

      value = dictionary.en?.message || `<${key}>`;
    }

    const paramKeys = value.match(/\$([A-Z_]+)\$/g);

    if (paramKeys) {
      paramValues.forEach((paramValue, i) => {
        value = value.replace(paramKeys[i], paramValue);
      });
    }

    return value;
  }
};
