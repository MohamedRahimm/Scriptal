import { MemberExpr, Identifier } from "../frontend/ast.ts";
import { evaluate } from "./interpreter.ts";
import { AnyVal } from "./values.ts";
import { NullVal, ObjectVal, RuntimeVal, StringVal, makeNativeFn } from "./values.ts"


export function globalEnv(){
    const env = new Environment()
    env.declareVar("print",makeNativeFn((args)=>{
        console.log(...args)
        return {type:"null",value:null} as NullVal
    }),true)
    return env
} 

export default class Environment {
    private parent?: Environment
    private variables: Map<string, RuntimeVal>
    private constants: Set<string>
    private anyVariables: Set<string>
    constructor(parentENV?: Environment) {
        this.parent = parentENV
        this.variables = new Map()
        this.constants = new Set()
        this.anyVariables = new Set()
    }
    public declareVar(varName: string, value: RuntimeVal, constant: boolean, any=false): RuntimeVal {
        if (this.variables.has(varName)) {
            throw `Cannot declare variable ${varName}.Already defined`
        }
        this.variables.set(varName, value)
        if (constant) this.constants.add(varName)
        if (any) this.anyVariables.add(varName)
        return value
    }
    public assignVar(varName: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varName)
        if (env.constants.has(varName)) throw `Cannot reassign cuz its constant`
        const varType = env.variables.get(varName)?.type
        if (env.anyVariables.has(varName) == false && varType !== value.type) throw `Invalid reassignment of type ${varType} to ${value.type}`
        env.variables.set(varName, value)
        return value
    }

    public lookupVar(varName: string): RuntimeVal {
        const env = this.resolve(varName)
        return env.variables.get(varName) as RuntimeVal
    }

    // public lookupOrMutObject(expr: MemberExpr,value?: RuntimeVal, property?: Identifier): RuntimeVal {
    //     if (expr.object.kind === 'MemberExpr') return this.lookupOrMutObject(expr.object as MemberExpr, value, expr.property as Identifier);

    //     const varname = (expr.object as Identifier).symbol;
    //     const env = this.resolve(varname);


    //     const currentProp = (evaluate(expr.property, env) as StringVal).value;
    //     if((env.lookupVar(varname) as ObjectVal).properties.has(currentProp)==false) throw `prop doesnt exist`
        
    // }

    public resolve(varName: string): Environment {
        if (this.variables.has(varName)) return this
        if (this.parent == undefined) throw `Cannot resolve ${varName} does not exist`
        return this.parent.resolve(varName)
    }
}