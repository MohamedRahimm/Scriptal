import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueType =
  | "null"
  | "boolean"
  | "string"
  | "number"
  | "any"
  | "unassigned"
  | "object"
  | "native-fn"
  | "function"
  | "break"
  | "continue"
  | "return"
  | "array";
export interface RuntimeVal {
  type: ValueType;
  // deno-lint-ignore no-explicit-any
  value?: any;
}
export interface NullVal extends RuntimeVal {
  type: "null";
  value: null;
}
export interface AnyVal extends RuntimeVal {
  type: "any";
  // deno-lint-ignore no-explicit-any
  value: any;
}
export interface NumberVal extends RuntimeVal {
  type: "number";
  value: number;
}

export interface BoolVal extends RuntimeVal {
  type: "boolean";
  value: boolean;
}

export interface UnassignedVal extends RuntimeVal {
  type: "unassigned";
  value: "unassigned";
}
export interface ObjectVal extends RuntimeVal {
  type: "object";
  properties: Map<string, RuntimeVal>;
}
export interface StringVal extends RuntimeVal {
  type: "string";
  methods: Map<string, RuntimeVal>;
  value: string;
}
export interface ArrayVal extends RuntimeVal {
  type: "array";
  methods: Map<string, RuntimeVal>;
  elements: RuntimeVal[];
}
export interface FunctionVal extends RuntimeVal {
  type: "function";
  name: string;
  parameters: string[];
  declarationEnv: Environment;
  body: Stmt[];
}
export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;
export interface NativeFnValue extends RuntimeVal {
  type: "native-fn";
  call: FunctionCall;
}
export function makeNativeFn(call: FunctionCall) {
  return { type: "native-fn", call } as NativeFnValue;
}

export interface BreakVal extends RuntimeVal {
  type: "break";
  value: "break";
}
export interface ContinueVal extends RuntimeVal {
  type: "continue";
  value: "continue";
}
export interface ReturnVal extends RuntimeVal {
  type: "return";
  value: RuntimeVal;
}
