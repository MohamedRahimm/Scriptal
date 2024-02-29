import { Program, VarDeclaration } from "../../ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { NullVal, RuntimeVal } from "../values.ts"

export function evalProgram(program: Program, env: Environment): RuntimeVal {
    let lastEvaluated: RuntimeVal = { type: "null", value: null } as NullVal
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env)
    }
    return lastEvaluated
}

export function evalVarDeclaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
    const value = declaration.value ? evaluate(declaration.value, env) : { type: "null", value: null } as NullVal
    const valueType = declaration.valueType
    const errorMsg = `Invalid assignment of type ${valueType} to type ${value.type}`
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
    }

    return env.declareVar(declaration.identifier, value, declaration.constant, declaration.any)
}
