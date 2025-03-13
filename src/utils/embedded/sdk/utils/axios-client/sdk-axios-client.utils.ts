import axios from "axios";
import { EMBEDDED_API_KEY } from "~utils/embedded/sdk/utils/url/sdk-url.utils";

const instance = axios.create({
  baseURL: "https://arconnect-embedded.com/api/"
});

instance.defaults.headers["x-api-key"] = EMBEDDED_API_KEY;

export function setAuthorization(jwtString: string | null) {
  if (jwtString)
    instance.defaults.headers.Authorization = `Bearer ${jwtString}`;
  else delete instance.defaults.headers.Authorization;
}
