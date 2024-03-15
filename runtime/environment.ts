import {
  ArrayVal,
  makeNativeFn,
  NullVal,
  NumberVal,
  ObjectVal,
  RuntimeVal,
  StringVal,
} from "./values.ts";
export function globalEnv() {
  const env = new Environment();
  env.declareVar(
    "print",
    makeNativeFn((args) => {
      for (let i = 0; i < args.length; i++) {
        console.log(args[i]);
      }
      return { type: "null", value: null } as NullVal;
    }),
    true,
  );
  env.declareVar(
    "len",
    makeNativeFn((args) => {
      const argType = args[0]?.type;
      if (argType === "array") {
        return {
          type: "number",
          value: (args[0] as ArrayVal).elements.length,
        } as NumberVal;
      } else if (argType === "string") {
        return {
          type: "number",
          value: (args[0] as StringVal).value.length,
        } as NumberVal;
      }
      throw `argument is not of type array or string`;
    }),
    true,
  );
  env.declareVar("Math", {
    type: "object",
    properties: new Map([
      [
        "abs",
        makeNativeFn((args) => {
          const arg = (args[0] as NumberVal)?.value;
          if (!arg) throw `Missing argument`;
          const value = arg < 0 ? arg * -1 : arg;
          return { type: "number", value } as NumberVal;
        }),
      ],
      [
        "floor",
        makeNativeFn((args) => {
          const arg = (args[0] as NumberVal)?.value;
          if (!arg) throw `Missing argument`;
          const value = Math.floor(arg);
          return { type: "number", value } as NumberVal;
        }),
      ],
      [
        "ceil",
        makeNativeFn((args) => {
          const arg = (args[0] as NumberVal)?.value;
          if (!arg) throw `Missing argument`;
          const value = Math.ceil(arg);
          return { type: "number", value } as NumberVal;
        }),
      ],
      [
        "round",
        makeNativeFn((args) => {
          const arg = (args[0] as NumberVal)?.value;
          if (!arg) throw `Missing argument`;
          const value = Math.round(arg);
          return { type: "number", value } as NumberVal;
        }),
      ],
      [
        "random",
        makeNativeFn((args) => {
          const min = (args[0] as NumberVal)?.value;
          if (!min) throw `Missing minimum number argument`;
          const max = (args[1] as NumberVal)?.value;
          if (!max) throw `Missing maximum number argument`;
          const value = Math.random() * (max - min) + min;
          return { type: "number", value } as NumberVal;
        }),
      ],
      [
        "max",
        makeNativeFn((args) => {
          let max = -Infinity;
          for (let i = 0; i < args.length; i++) {
            if (args[i].type !== "number") {
              throw `expected type number but got ${args[i].type}`;
            }
            const curr = (args[i] as NumberVal).value;
            max = curr > max ? curr : max;
          }
          return { type: "number", value: max } as NumberVal;
        }),
      ],
      [
        "min",
        makeNativeFn((args) => {
          let min = Infinity;
          for (let i = 0; i < args.length; i++) {
            if (args[i].type !== "number") {
              throw `expected type number but got ${args[i].type}`;
            }
            const curr = (args[i] as NumberVal).value;
            min = curr < min ? curr : min;
          }
          return { type: "number", value: min } as NumberVal;
        }),
      ],
    ]),
  } as ObjectVal, true);
  return env;
}
export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeVal>;
  private constants: Set<string>;
  constructor(parentENV?: Environment) {
    this.parent = parentENV;
    this.variables = new Map();
    this.constants = new Set();
  }
  public declareVar(
    varName: string,
    value: RuntimeVal,
    constant: boolean,
  ): RuntimeVal {
    if (this.variables.has(varName)) {
      throw `Cannot declare variable ${varName}.Already defined`;
    }
    this.variables.set(varName, value);
    if (constant) this.constants.add(varName);
    return value;
  }
  public assignVar(varName: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varName);
    if (env.constants.has(varName)) throw `Cannot reassign cuz its constant`;
    env.variables.set(varName, value);
    return value;
  }

  public lookupVar(varName: string): RuntimeVal {
    const env = this.resolve(varName);
    return env.variables.get(varName) as RuntimeVal;
  }

  public resolve(varName: string): Environment {
    if (this.variables.has(varName)) return this;
    if (this.parent == undefined) {
      throw `Cannot resolve ${varName} does not exist`;
    }
    return this.parent.resolve(varName);
  }
}
