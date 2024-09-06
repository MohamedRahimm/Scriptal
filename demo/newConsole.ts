// deno-lint-ignore-file no-explicit-any
interface ConsoleLogger extends Console {
  defaultLog: (...data: any[]) => void;
  log: (...data: any[]) => void;
  history: any[][];
  clearHistory: () => void;
}
export const newConsole = console as ConsoleLogger;
newConsole.history = [];
newConsole.defaultLog = console.log.bind(console);
newConsole.log = function (...args: any[]) {
  newConsole.defaultLog.apply(console, args);
  newConsole.history.push(arguments[0]);
};
console.log();
newConsole.clearHistory = function () {
  newConsole.history.length = 0;
};
