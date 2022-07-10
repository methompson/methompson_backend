export abstract class LoggerController {
  /**
   * Initialization step for the Logger. This is where you would create the db table
   * or create the log file.
   */
  abstract init(): Promise<unknown>;

  /**
   * Adds a log file
   * @param type The log type. E.g. 'debug', 'info', etc.
   * @param message The actual logged message.
   * @param time An ISO Timestamp of when the event occurred
   */
  abstract addLog(
    type: string,
    message: string,
    time?: string,
  ): Promise<unknown>;

  /**
   * Retrieves logs between the fromDate and toDate times
   * @param fromDate Date in ISO time string format representing earliest log
   * @param toDate Date in ISO time string format representing latest log
   */
  abstract readLogs(fromDate: string, toDate: string);
}
