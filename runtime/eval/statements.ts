import { FunctionDeclaration } from "../../frontend/ast.ts";
import { Program, VarDeclaration } from "../../frontend/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { UnassignedVal } from "../values.ts";
import { NullVal, RuntimeVal,FunctionVal,ReturnVal } from "../values.ts"

export function evalProgram(program: Program, env: Environment): RuntimeVal {
    let lastEvaluated: RuntimeVal = { type: "null", value: null } as NullVal
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env)
    }
    return lastEvaluated
}

export function evalVarDeclaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
    const value = declaration.value
		? evaluate(declaration.value, env)
		: {type:"null",value:null} as NullVal;

	return env.declareVar(declaration.identifier, value, declaration.constant);
}
export function evalFuncDeclaration(declaration: FunctionDeclaration, env: Environment): RuntimeVal {
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv:env,
        body:declaration.body
    } as FunctionVal
    return env.declareVar(declaration.name,fn,false)
}
