export function getBackupFrequency(): string {
  const { BACKUP_FREQUENCY } = process.env;
  const num = Number.parseInt(BACKUP_FREQUENCY);

  const hours: number = Number.isNaN(num) ? 24 : num;

  return `0 */${hours} * * * *`;
}
