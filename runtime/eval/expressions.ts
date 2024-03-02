import { AssignmentExpr, BinaryExpr, Identifier, NumericLiteral,ObjectLiteral } from "../../frontend/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { ObjectVal } from "../values.ts";
import { FloatVal, IntVal, NullVal, RuntimeVal,BoolVal } from "../values.ts"

function evalNumBinaryExpr(lhs: IntVal, rhs: IntVal, op: string): RuntimeVal{
    let res = 0
    if (op === "+") res = lhs.value + rhs.value
    else if (op === '-') res = lhs.value - rhs.value
    else if (op === '*') res = lhs.value * rhs.value
    //DIVISION BY 0 CHECKS
    else if (op === '/') res = lhs.value / rhs.value
    else if (op === '%') res = lhs.value % rhs.value
    else if (op === "**") res = lhs.value ** rhs.value
    else if (op === "//") res = Math.floor(lhs.value / rhs.value)

    if (res % 1 === 0) return { type: "int", value: res } as IntVal
    return { type: "float", value: res } as FloatVal
}

function evalBoolBinaryExpr(lhs:RuntimeVal,rhs:RuntimeVal,op:string):RuntimeVal{
    let value = true
    switch (op){
        case "&&":{
            if(lhs.type!=="boolean"||rhs.type!=="boolean") throw `Expected boolean values on both sides of the && operator`
            const lhsVal = (lhs as BoolVal).value
            const rhsVal = (rhs as BoolVal).value
            value = lhsVal && rhsVal
            break
        }
        case "||":
            if(lhs.type!=="boolean"||rhs.type!=="boolean") throw `Expected boolean values on both sides of the || operator`
            value = (lhs as BoolVal).value===true ||(rhs as BoolVal).value===true
            break
    }
    return {type: "boolean",value} as BoolVal
}

export function evalBinaryExpr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env)
    const rhs = evaluate(binop.right, env)
    if ((lhs.type === "float" || lhs.type === "int") && (rhs.type === "float" || rhs.type === "int")) return evalNumBinaryExpr(lhs as IntVal, rhs as IntVal, binop.operator)
    if(binop.operator==="&&"||binop.operator==="||") return evalBoolBinaryExpr(lhs as RuntimeVal, rhs as RuntimeVal, binop.operator)
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

export function evalObjectExpr(obj:ObjectLiteral,env:Environment): RuntimeVal{
    const object = {type:"object",properties:new Map()} as ObjectVal
    for(const {key,value} of obj.properties){
        const runtimeVal = (value==undefined) ? env.lookupVar(key) : evaluate(value,env)
        object.properties.set(key,runtimeVal)
    }
    return object
}