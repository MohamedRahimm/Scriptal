import { CallExpr, ForExpr, MemberExpr, UnaryExpr } from "../../frontend/ast.ts";
import { ArrayLiteral } from "../../frontend/ast.ts";
import { WhileExpr } from "../../frontend/ast.ts";
import { AssignmentExpr, BinaryExpr, Identifier, NumericLiteral,ObjectLiteral,IfExpr,ReturnStatement } from "../../frontend/ast.ts"
import Environment from "../environment.ts"
import { evaluate } from "../interpreter.ts"
import { ArrayVal, StringVal } from "../values.ts";
import { NumberVal } from "../values.ts";
import { AnyVal, FunctionVal, ObjectVal } from "../values.ts";
import { NullVal, RuntimeVal,BoolVal,NativeFnValue,ReturnVal,UnassignedVal } from "../values.ts"
import { evalVarDeclaration } from "./statements.ts";

function evalNumBinaryExpr(lhs: NumberVal, rhs: NumberVal, op: string): RuntimeVal{
    let res = 0
    if (op === "+") res = lhs.value + rhs.value
    else if (op === '-') res = lhs.value - rhs.value
    else if (op === '*') res = lhs.value * rhs.value
    else if (op === '/') res = lhs.value / rhs.value
    else if (op === '%') res = lhs.value % rhs.value
    else if (op === "**") res = lhs.value ** rhs.value
    else if (op === "//") res = Math.floor(lhs.value / rhs.value)

    return {type:"number",value:res} as NumberVal
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
            value = (lhs as NumberVal).value < (rhs as NumberVal).value
            break
        case ">":
            value = (lhs as NumberVal).value > (rhs as NumberVal).value
            break
        case "<=":
            value = (lhs as NumberVal).value <= (rhs as NumberVal).value
            break
        case ">=":
            value = (lhs as NumberVal).value >= (rhs as NumberVal).value
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
    if (lhs.type==="number" && rhs.type==="number") return evalNumBinaryExpr(lhs as NumberVal, rhs as NumberVal, op) 
    throw `Invalid Binary Expression cannot use the ${op} operator on ${lhs.type} and ${rhs.type}`
}
export function evalUnaryExpr(expr: UnaryExpr, env: Environment): RuntimeVal {
    const rhs = evaluate(expr.right,env) as NumberVal
    const res = {type:"number",value:0} as NumberVal
    if(rhs.type!=="number") throw `cannot use ${expr.operator} op on ${rhs.type} type`
    if(expr.operator==="+"){
        res.value = +rhs.value
    }
    else res.value = -rhs.value
    return res
}

export function evalIdentifier(ident: Identifier, env: Environment): RuntimeVal {
    const val = env.lookupVar(ident.symbol)
    return val
}

export function evalAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    // add support for objects and arrays
    if(node.assignee.kind==="MemberExpr"){
        const value = evaluate(node.value,env) 
        return evalMemberExpr(node.assignee as MemberExpr,env,value)
    }
    else if(node.assignee.kind==="ArrayLiteral"){
        const value = evaluate(node.value,env) 
        return evalMemberExpr(node.assignee as MemberExpr,env,value)
    }
    if (node.assignee.kind !== "Identifier") throw `Invalid LHS assignment expr ${node.assignee}`
    const varName = (node.assignee as Identifier).symbol
    return env.assignVar(varName, evaluate(node.value, env))
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
            scope.declareVar(varName,args[i],false)
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
export function evalMemberExpr(expr: MemberExpr, env: Environment,mutateObj?:RuntimeVal): RuntimeVal{
        if (expr.computed) { 
            const maybeObject = evaluate(expr.object, env)
            const identifier = evaluate(expr.property, env) 
            //Objects
            if (maybeObject.type === "object") {
                const properties = (maybeObject as ObjectVal).properties
                const ident = (identifier as StringVal).value
                if(ident==undefined) throw `invalid key`
                if (properties.has(ident)) {
                    if(mutateObj!=undefined){
                        properties.set(ident,mutateObj)
                    }
                    return properties.get(ident) as RuntimeVal;
                }
                return {type:"unassigned",value:"unassigned"} as UnassignedVal
            }
            else if(maybeObject.type==="array"){
                const elements = (maybeObject as ArrayVal).elements
                const index = (identifier as NumberVal).value
                if(identifier.type!=="number") throw `invalid index`
                if(elements.length<=index||index<0) throw `index out of bounds`
                if(mutateObj!=undefined){
                    elements[index] = mutateObj
                }
                return elements[index]
            }
        } 
        else {
            const obj = evaluate(expr.object,env) as ObjectVal;
            const ident = (expr.property as Identifier).symbol;
            if (obj.type != "object") {
                throw `Expected type object found type ${obj.type} instead.`;
            }
            if (obj.properties.has(ident)) {
                if(mutateObj!=undefined){
                    obj.properties.set(ident,mutateObj)
                }
                return obj.properties.get(ident) as RuntimeVal;
            }
            throw `non existant prop`
        }
    return {type:"unassigned",value:"unassigned"} as UnassignedVal
        

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