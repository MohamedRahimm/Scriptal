import {
  BoolVal,
  BreakVal,
  ContinueVal,
  NullVal,
  NumberVal,
  RuntimeVal,
  StringVal,
  UnassignedVal,
} from "./values.ts";
import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  Boolean,
  CallExpr,
  ForStmt,
  FunctionDeclaration,
  Identifier,
  IfStmt,
  MemberExpr,
  Null,
  NumericLiteral,
  ObjectLiteral,
  Program,
  ReturnStmt,
  Stmt,
  String,
  UnaryExpr,
  Unassigned,
  VarDeclaration,
  WhileStmt,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
  evalArrayExpr,
  evalAssignment,
  evalBinaryExpr,
  evalCallExpr,
  evalIdentifier,
  evalMemberExpr,
  evalObjectExpr,
  evalUnaryExpr,
} from "./eval/expressions.ts";
import {
  evalForStmt,
  evalFuncDeclaration,
  evalIfStmt,
  evalProgram,
  evalReturnStmt,
  evalVarDeclaration,
  evalWhileStmt,
} from "./eval/statements.ts";
export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: ((astNode as NumericLiteral).value),
        type: "number",
      } as NumberVal;
    case "Boolean":
      return {
        value: ((astNode as Boolean).value),
        type: "boolean",
      } as BoolVal;
    case "Null":
      return { value: ((astNode as Null).value), type: "null" } as NullVal;
    case "String":
      return {
        value: ((astNode as String).value),
        type: "string",
      } as StringVal;
    case "Unassigned":
      return {
        value: ((astNode as Unassigned).value),
        type: "unassigned",
      } as UnassignedVal;
    case "ContStmt":
      return { value: "continue", type: "continue" } as ContinueVal;
    case "BreakStmt":
      return { value: "break", type: "break" } as BreakVal;
    case "Identifier":
      return evalIdentifier(astNode as Identifier, env);
    case "ObjectLiteral":
      return evalObjectExpr(astNode as ObjectLiteral, env);
    case "BinaryExpr":
      return evalBinaryExpr(astNode as BinaryExpr, env);
    case "UnaryExpr":
      return evalUnaryExpr(astNode as UnaryExpr, env);
    case "CallExpr":
      return evalCallExpr(astNode as CallExpr, env);
    case "MemberExpr":
      return evalMemberExpr(astNode as MemberExpr, env);
    case "IfStmt":
      return evalIfStmt(astNode as IfStmt, env);
    case "WhileStmt":
      return evalWhileStmt(astNode as WhileStmt, env);
    case "ForStmt":
      return evalForStmt(astNode as ForStmt, env);
    case "Program":
      return evalProgram(astNode as Program, env);
    case "VarDeclaration":
      return evalVarDeclaration(astNode as VarDeclaration, env);
    case "FunctionDeclaration":
      return evalFuncDeclaration(astNode as FunctionDeclaration, env);
    case "AssignmentExpr":
      return evalAssignment(astNode as AssignmentExpr, env);
    case "ReturnStmt":
      return evalReturnStmt(astNode as ReturnStmt, env);
    case "ArrayLiteral":
      return evalArrayExpr(astNode as ArrayLiteral, env);
    default:
      console.log(astNode);
      throw `ASTNode not implemented yet`;
  }
}
