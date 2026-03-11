export async function invokeWithSleep<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  const promise = fn();
  await sleep(ms);
  return promise;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
