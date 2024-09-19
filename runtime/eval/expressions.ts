import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Identifier,
  MemberExpr,
  ObjectLiteral,
  StringLiteral,
  UnaryExpr,
} from "../../frontend/ast.ts";
import {
  AnyVal,
  ArrayVal,
  BoolVal,
  FunctionVal,
  makeNativeFn,
  NativeFnValue,
  NullVal,
  NumberVal,
  ObjectVal,
  RuntimeVal,
  StringVal,
  UnassignedVal,
} from "../values.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";

function evalNumBinaryExpr(
  lhs: NumberVal,
  rhs: NumberVal,
  op: string,
): RuntimeVal {
  let res = 0;
  switch (op) {
    case ("+"):
      res = lhs.value + rhs.value;
      break;
    case ("-"):
      res = lhs.value - rhs.value;
      break;
    case ("*"):
      res = lhs.value * rhs.value;
      break;
    case ("/"):
      res = lhs.value / rhs.value;
      break;
    case ("%"):
      res = lhs.value % rhs.value;
      break;
    case ("^"):
      res = lhs.value ** rhs.value;
      break;
    case ("//"):
      res = Math.floor(lhs.value / rhs.value);
      break;
  }
  return { type: "number", value: res } as NumberVal;
}
function evalBoolBinaryExpr(
  lhs: RuntimeVal,
  rhs: RuntimeVal,
  op: string,
): RuntimeVal {
  let value = true;
  switch (op) {
    case "&&": {
      if (lhs.type !== "boolean" || rhs.type !== "boolean") {
        throw `Expected boolean values on both sides of the && operator`;
      }
      const lhsVal = (lhs as BoolVal).value;
      const rhsVal = (rhs as BoolVal).value;
      value = lhsVal && rhsVal;
      break;
    }
    case "||":
      if (lhs.type !== "boolean" || rhs.type !== "boolean") {
        throw `Expected boolean values on both sides of the || operator`;
      }
      value = (lhs as BoolVal).value === true ||
        (rhs as BoolVal).value === true;
      break;
    case "==":
      //for object reference comparisons(linked list cycles)
      if (
        (lhs as AnyVal).value === undefined ||
        (rhs as AnyVal).value === undefined
      ) {
        return { type: "boolean", value: lhs === rhs } as BoolVal;
      }
      value = (lhs as AnyVal).value === (rhs as AnyVal).value;
      break;
    case "!=":
      //for object reference comparisons(linked list cycles)
      if (
        (lhs as AnyVal).value === undefined ||
        (rhs as AnyVal).value === undefined
      ) {
        return { type: "boolean", value: lhs !== rhs } as BoolVal;
      }
      value = (lhs as AnyVal).value !== (rhs as AnyVal).value;
      break;
    case "<":
      value = (lhs as NumberVal).value < (rhs as NumberVal).value;
      break;
    case ">":
      value = (lhs as NumberVal).value > (rhs as NumberVal).value;
      break;
    case "<=":
      value = (lhs as NumberVal).value <= (rhs as NumberVal).value;
      break;
    case ">=":
      value = (lhs as NumberVal).value >= (rhs as NumberVal).value;
      break;
  }
  return { type: "boolean", value } as BoolVal;
}
export function evalBinaryExpr(
  binop: BinaryExpr,
  env: Environment,
): RuntimeVal {
  const lhs = evaluate(binop.left, env);
  const rhs = evaluate(binop.right, env);
  const op = binop.operator;
  if (
    new Set<string>(["&&,||,==,!+,<,>,<=,>="]).has(op)
  ) {
    return evalBoolBinaryExpr(lhs as RuntimeVal, rhs as RuntimeVal, op);
  } else if (lhs.type === "number" && rhs.type === "number") {
    return evalNumBinaryExpr(lhs as NumberVal, rhs as NumberVal, op);
  }
  throw `Invalid Binary Expression cannot use the ${op} operator on ${lhs.type} and ${rhs.type}`;
}
export function evalUnaryExpr(expr: UnaryExpr, env: Environment): RuntimeVal {
  const rhs = evaluate(expr.right, env) as NumberVal;
  const res = { type: "number", value: 0 } as NumberVal;
  if (rhs.type !== "number") {
    throw `cannot use ${expr.operator} op on ${rhs.type} type`;
  }
  if (expr.operator === "+") {
    res.value = +rhs.value;
  } else if (expr.operator === "-") res.value = -rhs.value;
  return res;
}
export function evalIdentifier(
  ident: Identifier,
  env: Environment,
): RuntimeVal {
  const val = env.lookupVar(ident.symbol);
  return val;
}
export function evalAssignment(
  node: AssignmentExpr,
  env: Environment,
): RuntimeVal {
  // Deals with objects and Arrays
  if (node.assignee.kind === "MemberExpr") {
    const value = evaluate(node.value, env);
    return evalMemberExpr(node.assignee as MemberExpr, env, value);
  } else if (node.assignee.kind === "ArrayLiteral") {
    const value = evaluate(node.value, env);
    return evalMemberExpr(node.assignee as MemberExpr, env, value);
  } //normal variables
  else if (node.assignee.kind !== "Identifier") {
    throw `Invalid LHS assignment expr ${JSON.stringify(node)}`;
  }
  const varName = (node.assignee as Identifier).symbol;
  return env.assignVar(varName, evaluate(node.value, env));
}
export function evalObjectExpr(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeVal {
  const object = {
    type: "object",
    properties: new Map(),
    value: undefined,
  } as ObjectVal;
  for (const { key, value } of obj.properties) {
    const runtimeVal = (value == undefined)
      ? env.lookupVar(key)
      : evaluate(value, env);
    object.properties.set(key, runtimeVal);
  }

  return object;
}
export function evalArrayExpr(
  arr: ArrayLiteral,
  env: Environment,
): RuntimeVal {
  const array = {
    type: "array",
    methods: new Map([
      [
        "push",
        makeNativeFn((args) => {
          for (let i = 0; i < args.length; i++) {
            array.elements.push(args[i]);
          }
          return {
            type: "array",
            elements: array.elements,
            methods: array.methods,
          } as ArrayVal;
        }),
      ],
      [
        "pop",
        makeNativeFn(() => {
          const elem = array.elements.pop();
          return elem ||
            { type: "unassigned", value: "unassigned" } as UnassignedVal;
        }),
      ],
      [
        "shift",
        makeNativeFn(() => {
          const elem = array.elements.shift();
          return elem ||
            { type: "unassigned", value: "unassigned" } as UnassignedVal;
        }),
      ],
    ]),
    elements: [],
  } as ArrayVal;
  if (arr?.elements != undefined) {
    for (const element of arr.elements) {
      array.elements.push(evaluate(element, env));
    }
  }

  return array;
}
export function evalStringExpr(
  str: StringLiteral,
  env: Environment,
): RuntimeVal {
  const string = {
    type: "string",
    methods: new Map([
      [
        "concat",
        makeNativeFn((args) => {
          for (let i = 0; i < args.length; i++) {
            if (args[i].type !== "string") {
              throw `${JSON.stringify(args[i])} is not of type string`;
            }
            string.value += (args[i] as StringVal).value;
          }
          return { type: "string", value: string.value } as StringVal;
        }),
      ],
    ]),
    value: str.value,
  } as StringVal;
  if (str?.methods != undefined) {
    for (const { key, value } of str.methods) {
      const runtimeVal = (value == undefined)
        ? env.lookupVar(key)
        : evaluate(value, env);
      string.methods.set(key, runtimeVal);
    }
  }

  return string;
}
export function evalCallExpr(expr: CallExpr, env: Environment): RuntimeVal {
  const args = expr.args.map((arg) => evaluate(arg, env));
  const fn = evaluate(expr.caller, env);
  if (fn.type === "native-fn") {
    const result = (fn as NativeFnValue).call(args, env);
    return result;
  }
  if (fn.type === "function") {
    const func = fn as FunctionVal;
    const scope = new Environment(func.declarationEnv);
    //Create variables from the function parameters
    for (let i = 0; i < func.parameters.length; i++) {
      const varName = func.parameters[i];
      scope.declareVar(varName, args[i], false);
    }
    let result: RuntimeVal = { type: "null", value: null } as NullVal;
    for (const stmt of func.body) {
      result = evaluate(stmt, scope);
      if (result.type === "return") return result;
    }
    return result;
  }

  throw `Cannot call a value that is not a function ${JSON.stringify(fn)}`;
}
export function evalMemberExpr(
  expr: MemberExpr,
  env: Environment,
  mutateObj?: RuntimeVal,
): RuntimeVal {
  // handles arr[idx] || obj[complexExpr]
  if (expr.computed) {
    const maybeObject = evaluate(expr.object, env);
    const identifier = evaluate(expr.property, env);
    if (maybeObject.type === "object") {
      const properties = (maybeObject as ObjectVal).properties;
      const ident = (identifier as StringVal).value;
      if (ident == undefined) throw `invalid key`;
      if (mutateObj != undefined) {
        properties.set(ident, mutateObj);
      }
      if (properties.has(ident)) {
        return properties.get(ident) as RuntimeVal;
      }
      // throw `Cannot set properties of unassinged`;
    } else if (maybeObject.type === "array") {
      const elements = (maybeObject as ArrayVal).elements;
      const index = (identifier as NumberVal).value;
      if (identifier.type !== "number") throw `invalid index`;
      if (elements.length <= index || index < 0) throw `index out of bounds`;
      if (mutateObj != undefined) {
        elements[index] = mutateObj;
      }
      return elements[index];
    } else if (maybeObject.type === "string") {
      const value = (maybeObject as StringVal).value;
      const index = (identifier as NumberVal).value;
      if (identifier.type !== "number") throw `invalid index`;
      if (value.length <= index || index < 0) throw `index out of bounds`;
      return evalStringExpr(
        { kind: "StringLiteral", value: value[index] } as StringLiteral,
        env,
      );
    }
  } // handles obj.member
  else {
    const type = evaluate(expr.object, env).type;
    const obj = evaluate(expr.object, env);
    const ident = (expr.property as Identifier).symbol;
    if (type !== "string" && type !== "object" && type !== "array") {
      throw `Expected type object found type ${obj.type} instead.`;
    }
    if (type === "object") {
      const object = obj as ObjectVal;
      if (mutateObj != undefined) {
        object.properties.set(ident, mutateObj);
      }
      if (object.properties.has(ident)) {
        return object.properties.get(ident) as RuntimeVal;
      } else {
        throw `Cannot set properties of unassinged`;
      }
    } // ArrayVal and StringVal both contain "methods"
    else {
      const object = obj as ArrayVal;
      if (object.methods.has(ident)) {
        return object.methods.get(ident) as RuntimeVal;
      } else throw `Method ${ident} does not exist`;
    }
  }
  return { type: "unassigned", value: "unassigned" } as UnassignedVal;
}
