import { Parser } from "./frontend/parser.ts"
import { globalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts"

async function run(filename:string){
    const parser = new Parser()
    const env = globalEnv()
    const input = await Deno.readTextFile(filename)
    const program = parser.produceAst(input)
    // console.log(program)
    const result = evaluate(program,env)
    console.log(result)
}
function repl() {
    const parser = new Parser()
    const env = globalEnv()
    console.log("\nrepl v0.1")
    while (true) {
        const input = prompt("> ")
        if (!input || input.includes("exit")) break
        const program = parser.produceAst(input)
        // console.log(program)
        const result = evaluate(program, env)
        console.log(result)
    }
}
run("test.txt")
// repl()