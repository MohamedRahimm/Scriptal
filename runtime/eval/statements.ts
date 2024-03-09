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
    const value = declaration.value ? evaluate(declaration.value, env) : { type: "unassigned", value: "unassigned" } as UnassignedVal
    const valueType = declaration.valueType
    const errorMsg = `Invalid assignment of type ${valueType} to type ${value.type}`
    if(value.type==="unassigned") return env.declareVar(declaration.identifier, value, declaration.constant, declaration.any)
    switch (valueType) {
        case ("bool"):
            if (value.type !== "boolean") throw errorMsg
            break
        case "int":
            if (value.type != "int") throw errorMsg
            break
        case ("float"):
            if (value.type !== "float") throw errorMsg
            break
        case ("str"):
            if (value.type !== "string") throw errorMsg
            break
        case ("obj"):
            if(value.type!=="object") throw errorMsg
            break
    }

    return env.declareVar(declaration.identifier, value, declaration.constant, declaration.any)
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
