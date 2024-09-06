import { Parser } from "../frontend/parser.ts";
import { globalEnv } from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";
import { readConsole } from "./parseConsole.ts";
import { prettyPrintJson } from "pretty-print-json";

const form = document.querySelector("form")!;
const output = document.querySelector("output")!;
const parser = new Parser();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  output.innerHTML = "";
  const input = (document.querySelector("#input") as HTMLDivElement).innerText;
  if (input) {
    const env = globalEnv();
    const program = parser.produceAst(input);
    evaluate(program, env);
    const consoleHistory = readConsole();
    for (const jsonObj of consoleHistory) {
      const html = prettyPrintJson.toHtml(JSON.parse(jsonObj));
      output.innerHTML += "\n" + html;
    }
  }
});
const errorHandler = (e: ErrorEvent) => {
  output.innerText = e.message.substring("Uncaught".length);
};
globalThis.addEventListener("error", errorHandler, true);
