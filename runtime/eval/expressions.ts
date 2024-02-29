import { AssignmentExpr, BinaryExpr, Identifier, NumericLiteral } from "../../ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { FloatVal, IntVal, NullVal, RuntimeVal } from "../values.ts"

function evalNumBinaryExpr(lhs: IntVal | FloatVal, rhs: IntVal | FloatVal, op: string): IntVal | FloatVal {
    let res = 0
    if (op === "+") res = lhs.value + rhs.value
    else if (op === '-') res = lhs.value - rhs.value
    else if (op === '*') res = lhs.value * rhs.value
    //DIVISION BY 0 CHECKS
    else if (op === '/') res = lhs.value / rhs.value
    else if (op === '%') res = lhs.value % rhs.value
    else if (op === "**") res = lhs.value ** rhs.value
    else if (op === "//") res = Math.floor(lhs.value / rhs.value)

    if (res % 1 === 0) return { type: "int", value: res }
    return { type: "float", value: res }
}

export function evalBinaryExpr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env)
    const rhs = evaluate(binop.right, env)
    if ((lhs.type === "float" || lhs.type === "int") && (rhs.type === "float" || rhs.type === "int")) return evalNumBinaryExpr(lhs as IntVal, rhs as IntVal, binop.operator)
    return { type: "null", value: null } as NullVal
}

export function evalIdentifier(ident: Identifier, env: Environment): RuntimeVal {
    const val = env.lookupVar(ident.symbol)
    return val
}

export function evalAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    if (node.assignee.kind !== "Identifier") throw `Invalid LHS assignment expr ${node.assignee}`
    const varName = (node.assignee as Identifier).symbol
    return env.assignVar(varName, evaluate(node.value, env))
}

export function evalNumericLiteral(node: NumericLiteral): RuntimeVal {
    if (node.value % 1 !== 0) return { type: "float", value: node.value } as FloatVal
    return { type: "int", value: node.value } as IntVal
}