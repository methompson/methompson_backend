export async function delay(milliseconds?: number) {
  const timer = milliseconds ?? 60000;
  return new Promise<void>((res) => {
    setTimeout(() => res(), timer);
  });
}
