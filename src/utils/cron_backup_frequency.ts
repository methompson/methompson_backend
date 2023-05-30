import { isString } from '@/src/utils/type_guards';

export function getBackupFrequency(): string {
  const { BACKUP_FREQUENCY } = process.env;

  const bu = isString(BACKUP_FREQUENCY) ? BACKUP_FREQUENCY : '24';

  const num = Number.parseInt(bu);

  const hours: number = Number.isNaN(num) ? 24 : num;

  console.log('hours', hours);

  return `0 0 */${hours} * * *`;
}
