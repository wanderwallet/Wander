import { decodeDomainToASCII } from "~routes/popup/arns/utils";
import { useMemo } from "react";

/** Decodes names from punycode to readable format */
export function ProfileName({ name }: { name: string }) {
  const decodedName = useMemo(() => decodeDomainToASCII(name), [name]);

  return decodedName;
}
