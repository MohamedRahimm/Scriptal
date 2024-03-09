import { CallExpr, ForExpr, MemberExpr } from "../../frontend/ast.ts";
import { ArrayLiteral } from "../../frontend/ast.ts";
import { WhileExpr } from "../../frontend/ast.ts";
import { AssignmentExpr, BinaryExpr, Identifier, NumericLiteral,ObjectLiteral,IfExpr,ReturnStatement } from "../../frontend/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { ArrayVal, BreakVal, ContinueVal } from "../values.ts";
import { AnyVal, FunctionVal, ObjectVal } from "../values.ts";
import { FloatVal, IntVal, NullVal, RuntimeVal,BoolVal,NativeFnValue,ReturnVal } from "../values.ts"
import { evalVarDeclaration } from "./statements.ts";

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
        case "==":
            value = (lhs as AnyVal).value === (rhs as AnyVal).value
            break
        case "!=":
            value = (lhs as AnyVal).value !== (rhs as AnyVal).value
            break
        case "<":
            value = (lhs as AnyVal).value < (rhs as AnyVal).value
            break
        case ">":
            value = (lhs as AnyVal).value > (rhs as AnyVal).value
            break
        case "<=":
            value = (lhs as AnyVal).value <= (rhs as AnyVal).value
            break
        case ">=":
            value = (lhs as AnyVal).value >= (rhs as AnyVal).value
            break
    }
    return {type: "boolean",value} as BoolVal
}

export function evalBinaryExpr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env)
    const rhs = evaluate(binop.right, env)
    const op = binop.operator
    if(op==="&&"
    ||op==="||"
    || op==="=="
    || op==="!="
    || op==="<"
    || op===">"
    || op==="<="
    || op===">="
    ) {
        return evalBoolBinaryExpr(lhs as RuntimeVal, rhs as RuntimeVal, op)
    }
    if ((lhs.type === "float" || lhs.type === "int") && (rhs.type === "float" || rhs.type === "int")) return evalNumBinaryExpr(lhs as IntVal, rhs as IntVal, op) 
    throw `Invalid Binary Expression cannot use the ${op} operator on ${lhs.type} and ${rhs.type}`
}

export function evalIdentifier(ident: Identifier, env: Environment): RuntimeVal {
    const val = env.lookupVar(ident.symbol)
    return val
}

export function evalAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    //add support for objects
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
export function evalArrayExpr(arr:ArrayLiteral,env:Environment): RuntimeVal{
    const array = {type:"array",elements:[]} as ArrayVal
    for(const element of arr.value){
        array.elements.push(evaluate(element,env))
    }
    return array
}
export function evalCallExpr(expr:CallExpr,env:Environment): RuntimeVal{
    const args = expr.args.map((arg)=>evaluate(arg,env))
    const fn = evaluate(expr.caller,env)
    if(fn.type==="native-fn"){
        const result = (fn as NativeFnValue).call(args,env)
        return result
    } 
    if(fn.type==="function"){
        const func = fn as FunctionVal
        const scope = new Environment(func.declarationEnv)
        //Create variable for the parameter
        for(let i = 0;i<func.parameters.length;i++){
            const varName = func.parameters[i]
            scope.declareVar(varName,args[i],false,true)
        }
        let result:RuntimeVal = {type:"null",value:null} as NullVal
        for(const stmt of func.body){
             result = evaluate(stmt,scope)
             if(result.type==="return") return result
        }
        return result
    }
    
    throw `Cannot call a value that is not a function ${JSON.stringify(fn)}`
}
export function evalMemberExpr(expr: MemberExpr, env: Environment): RuntimeVal{
    
        if (expr.computed) {
            let obj = evaluate(expr.object, env) as ObjectVal;
            let ident = (evaluate(expr.property, env) as AnyVal).value;
            if(ident==undefined) throw `idk man`
            if (obj.type != "object") {
                throw `Expected type object found type ${obj.type} instead.`;
            }
            if (obj.properties.has(ident)) {
                return obj.properties.get(ident) as RuntimeVal;
            }
        } else {
            let obj = evaluate(expr.object, env) as ObjectVal;
            let ident = (expr.property as Identifier).symbol;
            if (obj.type != "object") {
                throw `Expected type object found type ${obj.type} instead.`;
            }
            if (obj.properties.has(ident)) {
                return obj.properties.get(ident) as RuntimeVal;
            }
        }
    
        throw `non existant prop`

}

export function evalIfExpr(expr:IfExpr, env:Environment):RuntimeVal{
    const condition = evaluate(expr.condition,env) as BoolVal
    if(condition.type!=="boolean") throw`Invalid condition for If Statement`
    const scope = new Environment(env)
    let result:RuntimeVal = {type:"null",value:null} as NullVal
    if(condition.value===true){
        for(const stmt of expr.body){
            result = evaluate(stmt,scope)
            if(result.type==="return") return (result as ReturnVal).value
            if(result.type==="break") {
                break
            }
            else if(result.type==="continue") {
                break
            }
        }
    }
    else if (expr.elseExpr!=undefined){
        for(const stmt of expr.elseExpr){
            result = evaluate(stmt,scope)
            if(result.type==="return") return (result as ReturnVal).value
            if(result.type==="break") {
                break
            }
            else if(result.type==="continue") {
                break
            }
        }
    }
    return result
}
export function evalForExpr(declaration:ForExpr, env:Environment):RuntimeVal{
    const scope = new Environment(env)
    evalVarDeclaration(declaration.initVar,scope)
    const body = declaration.body
    const iteration = declaration.iteration
    let condition = evaluate(declaration.condition,scope)
    while((condition as BoolVal).value===true){
        let shouldBreak = false
        for(const stmt of body){
            const lastEvaled = evaluate(stmt,scope)
            if(lastEvaled.type==="break") {
                shouldBreak = true
                break
            }
            else if(lastEvaled.type==="continue") {
                break
            }
            if(lastEvaled.type==="return") return (lastEvaled as ReturnVal).value
        }
        if(shouldBreak===true) break
        evalAssignment(iteration,scope)
        condition = evaluate(declaration.condition,scope)
    } 
    return {type:"null",value:null} as NullVal
}
export function evalWhileExpr(declaration:WhileExpr, env:Environment):RuntimeVal{
    const scope = new Environment(env)
    const body = declaration.body
    let condition = evaluate(declaration.condition,scope)
    while((condition as BoolVal).value===true){
        let shouldBreak = false
        let shouldContinue = false
        for(const stmt of body){
            const lastEvaled = evaluate(stmt,scope)
            if(lastEvaled.type==="break") {
                shouldBreak = true
                break
            }
            if(lastEvaled.type==="continue") {
                shouldContinue = true
                break
            }
            if(lastEvaled.type==="return") return (lastEvaled as ReturnVal).value
        }
        if(shouldBreak===true) break
        if(shouldContinue===true) continue
        condition = evaluate(declaration.condition,scope)
    } 
    return {type:"null",value:null} as NullVal
}

export function evalReturnStatement(declaration:ReturnStatement, env:Environment):RuntimeVal{
    const value = evaluate(declaration.value,env)
    return {type:"return",value} as ReturnVal
}