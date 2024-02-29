import { Parser } from "./parser.ts"
import Environment from "./runtime/environment.ts"
import { evaluate } from "./runtime/interpreter.ts"
async function repl() {
    const parser = new Parser()
    const env = new Environment()
    console.log("\nrepl v0.1")
    while (true) {
        const input = prompt("> ")
        if (!input || input.includes("exit")) break
        const program = parser.produceAst(input)
        console.log(program)
        const result = evaluate(program, env)
        console.log(result)
    }
}
repl()