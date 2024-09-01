import { Parser } from "../frontend/parser.ts";
import { globalEnv } from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";

interface ConsoleLogger extends Console {
  defaultLog: (...args: any[]) => void;
  log: () => void;
  history: any[][];
  clearHistory: () => void;
}
const newConsole = console as ConsoleLogger;
newConsole.history = [];
newConsole.defaultLog = console.log.bind(console);
newConsole.log = function (...args: any[]) {
  newConsole.defaultLog.apply(console, args);
  newConsole.history.push(arguments[0]);
};

newConsole.clearHistory = function () {
  newConsole.history.length = 0;
};

const form = document.querySelector("form")!;
const code = document.querySelector("code")!;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.querySelector("textarea")?.value;
  if (input) {
    const parser = new Parser();
    const env = globalEnv();
    const program = parser.produceAst(input);
    const result = evaluate(program, env);
    let output = "";
    newConsole.defaultLog("history", newConsole.history);
    for (let i = 0; i < newConsole.history.length; i++) {
      const originalStr = JSON.stringify(newConsole.history[i]);
      let nestedObj = "";
      for (const prop in newConsole.history[i]) {
        if (newConsole.history[i][prop] instanceof Map) {
          nestedObj = JSON.stringify(
            Object.fromEntries(newConsole.history[i][prop]),
          );
        }
        //include properties
        const idx = originalStr.search(/"methods":{/) + `"methods":{`.length;
        output = originalStr.substring(0, idx) + nestedObj +
          originalStr.substring(idx, originalStr.length) + "\n";
      }
      code.innerText = output + JSON.stringify(result);
      newConsole.clearHistory();
    }
  }
});
const errorHandler = (e: ErrorEvent) => {
  code.innerText = e.message.substring("Uncaught".length);
};
globalThis.addEventListener("error", errorHandler, true);
