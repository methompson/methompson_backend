export function logConfiguration() {
  const console_logging = process.env.CONSOLE_LOGGING === 'true';
  const db_logging = process.env.DB_LOGGING === 'true';

  return {
    console_logging,
    db_logging,
  };
}
