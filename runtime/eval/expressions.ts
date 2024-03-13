import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Identifier,
  MemberExpr,
  ObjectLiteral,
  UnaryExpr,
} from "../../frontend/ast.ts";
import {
  AnyVal,
  ArrayVal,
  BoolVal,
  FunctionVal,
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
      value = (lhs as AnyVal).value === (rhs as AnyVal).value;
      break;
    case "!=":
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
    op === "&&" ||
    op === "||" ||
    op === "==" ||
    op === "!=" ||
    op === "<" ||
    op === ">" ||
    op === "<=" ||
    op === ">="
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
    throw `Invalid LHS assignment expr ${node.assignee}`;
  }
  const varName = (node.assignee as Identifier).symbol;
  return env.assignVar(varName, evaluate(node.value, env));
}
export function evalObjectExpr(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeVal {
  const object = { type: "object", properties: new Map() } as ObjectVal;
  for (const { key, value } of obj.properties) {
    const runtimeVal = (value == undefined)
      ? env.lookupVar(key)
      : evaluate(value, env);
    object.properties.set(key, runtimeVal);
  }
  return object;
}
export function evalArrayExpr(arr: ArrayLiteral, env: Environment): RuntimeVal {
  const array = { type: "array", elements: [] } as ArrayVal;
  for (const element of arr.elements) {
    array.elements.push(evaluate(element, env));
  }
  return array;
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
      throw `Cannot set properties of unassinged`;
    } else if (maybeObject.type === "array") {
      const elements = (maybeObject as ArrayVal).elements;
      const index = (identifier as NumberVal).value;
      if (identifier.type !== "number") throw `invalid index`;
      if (elements.length <= index || index < 0) throw `index out of bounds`;
      if (mutateObj != undefined) {
        elements[index] = mutateObj;
      }
      return elements[index];
    }
  } // handles obj.member
  else {
    const obj = evaluate(expr.object, env) as ObjectVal;
    const ident = (expr.property as Identifier).symbol;
    if (obj.type != "object") {
      throw `Expected type object found type ${obj.type} instead.`;
    }
    if (mutateObj != undefined) {
      obj.properties.set(ident, mutateObj);
    }
    if (obj.properties.has(ident)) {
      return obj.properties.get(ident) as RuntimeVal;
    }
    throw `Cannot set properties of unassinged`;
  }
  return { type: "unassigned", value: "unassigned" } as UnassignedVal;
}
