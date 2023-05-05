export interface Backupable {
  backup: () => void | Promise<void>;
}
