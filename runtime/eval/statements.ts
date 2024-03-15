import {
  ForStmt,
  FunctionDeclaration,
  IfStmt,
  Program,
  ReturnStmt,
  VarDeclaration,
  WhileStmt,
} from "../../frontend/ast.ts";
import {
  BoolVal,
  FunctionVal,
  NullVal,
  ReturnVal,
  RuntimeVal,
  UnassignedVal,
} from "../values.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { evalAssignment } from "./expressions.ts";

export function evalProgram(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = { type: "null", value: null } as NullVal;
  for (const statement of program.body) {
    lastEvaluated = evaluate(statement, env);
  }
  return lastEvaluated;
}
export function evalVarDeclaration(
  declaration: VarDeclaration,
  env: Environment,
): RuntimeVal {
  const value = declaration.value
    ? evaluate(declaration.value, env)
    : { type: "unassigned", value: "unassigned" } as UnassignedVal;

  return env.declareVar(declaration.identifier, value, declaration.constant);
}
export function evalFuncDeclaration(
  declaration: FunctionDeclaration,
  env: Environment,
): RuntimeVal {
  const fn = {
    type: "function",
    name: declaration.name,
    parameters: declaration.parameters,
    declarationEnv: env,
    body: declaration.body,
  } as FunctionVal;
  return env.declareVar(declaration.name, fn, false);
}
export function evalIfStmt(expr: IfStmt, env: Environment): RuntimeVal {
  const condition = evaluate(expr.condition, env) as BoolVal;
  if (condition.type !== "boolean") throw `Invalid condition for If Statement`;
  const scope = new Environment(env);
  let result: RuntimeVal = { type: "null", value: null } as NullVal;
  if (condition.value === true) {
    for (const stmt of expr.body) {
      result = evaluate(stmt, scope);
      if (result.type === "return") return (result as ReturnVal);
      if (result.type === "break") {
        break;
      } else if (result.type === "continue") {
        break;
      }
    }
  } else if (expr.elseExpr != undefined) {
    for (const stmt of expr.elseExpr) {
      result = evaluate(stmt, scope);
      if (result.type === "return") return (result as ReturnVal);
      if (result.type === "break") {
        break;
      } else if (result.type === "continue") {
        break;
      }
    }
  }
  return result;
}
export function evalForStmt(
  declaration: ForStmt,
  env: Environment,
): RuntimeVal {
  const scope = new Environment(env);
  evalVarDeclaration(declaration.initVar, scope);
  const body = declaration.body;
  const iteration = declaration.iteration;
  let condition = evaluate(declaration.condition, scope);
  while ((condition as BoolVal).value === true) {
    let shouldBreak = false;
    for (const stmt of body) {
      const lastEvaled = evaluate(stmt, scope);
      if (lastEvaled.type === "break") {
        shouldBreak = true;
        break;
      } else if (lastEvaled.type === "continue") {
        break;
      }
      if (lastEvaled.type === "return") return (lastEvaled as ReturnVal);
    }
    if (shouldBreak === true) break;
    evalAssignment(iteration, scope);
    condition = evaluate(declaration.condition, scope);
  }
  return { type: "null", value: null } as NullVal;
}
export function evalWhileStmt(
  declaration: WhileStmt,
  env: Environment,
): RuntimeVal {
  const scope = new Environment(env);
  const body = declaration.body;
  let condition = evaluate(declaration.condition, scope);
  while ((condition as BoolVal).value === true) {
    let shouldBreak = false;
    let shouldContinue = false;
    for (const stmt of body) {
      const lastEvaled = evaluate(stmt, scope);
      if (lastEvaled.type === "break") {
        shouldBreak = true;
        break;
      }
      if (lastEvaled.type === "continue") {
        shouldContinue = true;
        break;
      }
      if (lastEvaled.type === "return") return (lastEvaled as ReturnVal);
    }
    if (shouldBreak === true) break;
    if (shouldContinue === true) continue;
    condition = evaluate(declaration.condition, scope);
  }
  return { type: "null", value: null } as NullVal;
}
export function evalReturnStmt(
  declaration: ReturnStmt,
  env: Environment,
): RuntimeVal {
  const value = evaluate(declaration.value, env);
  return { type: "return", value } as ReturnVal;
}
