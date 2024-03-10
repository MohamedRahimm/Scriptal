
import { NullVal,  RuntimeVal,  makeNativeFn } from "./values.ts"


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
    constructor(parentENV?: Environment) {
        this.parent = parentENV
        this.variables = new Map()
        this.constants = new Set()
    }
    public declareVar(varName: string, value: RuntimeVal, constant: boolean): RuntimeVal {
        if (this.variables.has(varName)) {
            throw `Cannot declare variable ${varName}.Already defined`
        }
        this.variables.set(varName, value)
        if (constant) this.constants.add(varName)
        return value
    }
    public assignVar(varName: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varName)
        if (env.constants.has(varName)) throw `Cannot reassign cuz its constant`
        env.variables.set(varName, value)
        return value
    }

    public lookupVar(varName: string): RuntimeVal {
        const env = this.resolve(varName)
        return env.variables.get(varName) as RuntimeVal
    }

    public resolve(varName: string): Environment {
        if (this.variables.has(varName)) return this
        if (this.parent == undefined) throw `Cannot resolve ${varName} does not exist`
        return this.parent.resolve(varName)
    }
}