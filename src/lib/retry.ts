export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts = 3,
  initialDelay = 500
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;
  while (attempt < attempts) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= attempts) throw err;
      // jitter: random between 0 and delay
      const jitter = Math.floor(Math.random() * delay);
      await new Promise((res) => setTimeout(res, delay + jitter));
      delay *= 2;
    }
  }
  // Shouldn't reach here
  return fn();
}
