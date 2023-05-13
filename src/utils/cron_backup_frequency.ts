export function getBackupFrequency(): string {
  const { BACKUP_FREQUENCY } = process.env;
  const num = Number.parseInt(BACKUP_FREQUENCY);

  const hours: number = Number.isNaN(num) ? 24 : num;

  console.log('hours', hours);

  return `0 0 */${hours} * * *`;
}
