import { Parser } from "./frontend/parser.ts"
import Environment from "./runtime/environment.ts"
import { evaluate } from "./runtime/interpreter.ts"
import { NullVal } from "./runtime/values.ts";
import { makeNativeFn } from "./runtime/values.ts";
async function run(filename:string){
    const parser = new Parser()
    const env = new Environment()
    env.declareVar("print",makeNativeFn((args,scope)=>{
                console.log(...args)
                return {type:"null",value:null} as NullVal
            }),true,true)
    const input = await Deno.readTextFile(filename)
    const program = parser.produceAst(input)
    const result = evaluate(program,env)
    console.log(result)
}
run("test.txt")
function repl() {
    
    const parser = new Parser()
    const env = new Environment()
    
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
// repl()