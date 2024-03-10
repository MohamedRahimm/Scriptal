import { Parser } from "./frontend/parser.ts";
import { globalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

async function init() {
  while (true) {
    const mode = prompt("Read File(RF) or REPL Mode(REPL)? >");
    if (mode?.includes("RF") || mode?.includes("rf")) {
      const res = await run("test.txt");
      console.log(res);
      return;
    } else if (mode?.includes("REPL") || mode?.includes("repl")) {
      return repl();
    } else if (!mode || mode.includes("exit")) break;
    else {
      throw `Invalid Mode`;
    }
  }
}

async function run(filename: string) {
  const parser = new Parser();
  const env = globalEnv();
  const input = await Deno.readTextFile(filename);
  const program = parser.produceAst(input);
  // console.log(program)
  const result = evaluate(program, env);
  return result;
}
function repl() {
  const parser = new Parser();
  const env = globalEnv();
  console.log("\nrepl v0.1");
  while (true) {
    const input = prompt("> ");
    if (!input || input.includes("exit")) break;
    const program = parser.produceAst(input);
    // console.log(program);
    const result = evaluate(program, env);
    console.log(result);
  }
}
init();
