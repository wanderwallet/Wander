export function isPromise(val: any): val is Promise<any> {
  return val && (<Promise<any>>val).then !== undefined;
}
