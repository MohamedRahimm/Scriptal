import { RuntimeVal, NullVal, BoolVal, StringVal } from "./values.ts";
import { BinaryExpr, NumericLiteral, Statement, Program, Identifier, VarDeclaration, AssignmentExpr, Boolean, Null, String, ObjectLiteral,CallExpr, ForExpr, Unassigned, MemberExpr } from "../frontend/ast.ts"
import Environment from "./environment.ts";
import { evalIdentifier, evalBinaryExpr, evalAssignment, evalNumericLiteral,evalObjectExpr, evalCallExpr, evalIfExpr, evalForExpr,evalWhileExpr, evalMemberExpr, evalReturnStatement, evalArrayExpr, } from "./eval/expressions.ts";
import { evalFuncDeclaration, evalProgram, evalVarDeclaration } from "./eval/statements.ts"
import { FunctionDeclaration } from "../frontend/ast.ts";
import { IfExpr } from "../frontend/ast.ts";
import { WhileExpr } from "../frontend/ast.ts";
import { UnassignedVal } from "./values.ts";
import { ReturnStatement,ArrayLiteral } from "../frontend/ast.ts";
import { ContinueVal } from "./values.ts";
import { BreakVal } from "./values.ts";


export function evaluate(astNode: Statement, env: Environment): RuntimeVal {
    switch (astNode.kind) {
        case "NumericLiteral":
            return evalNumericLiteral(astNode as NumericLiteral)
        case "Boolean":
            return { value: ((astNode as Boolean).value), type: "boolean" } as BoolVal
        case "Null":
            return { value: ((astNode as Null).value), type: "null" } as NullVal
        case "String":
            return { value: ((astNode as String).value), type: "string" } as StringVal
        case "Unassigned":
            return { value: ((astNode as Unassigned).value), type: "unassigned" } as UnassignedVal
        case "Identifier":
            return evalIdentifier(astNode as Identifier, env)
        case "ObjectLiteral":
            return evalObjectExpr(astNode as ObjectLiteral, env)
        case "BinaryExpr":
            return evalBinaryExpr(astNode as BinaryExpr, env)
        case "CallExpr":
            return evalCallExpr(astNode as CallExpr, env)
        case "MemberExpr":
            return evalMemberExpr(astNode as MemberExpr, env)
        case "IfExpr":
            return evalIfExpr(astNode as IfExpr, env)
        case "WhileExpr":
            return evalWhileExpr(astNode as WhileExpr, env)
        case "ForExpr":
            return evalForExpr(astNode as ForExpr, env)
        case "Program":
            return evalProgram(astNode as Program, env)
        case "VarDeclaration":
            return evalVarDeclaration(astNode as VarDeclaration, env)
        case "FunctionDeclaration":
            return evalFuncDeclaration(astNode as FunctionDeclaration, env)
        case "AssignmentExpr":
            return evalAssignment(astNode as AssignmentExpr, env)
        case "ReturnStatement":
            return evalReturnStatement(astNode as ReturnStatement, env)
        case "ContinueStatement":
            return { type:"continue",value:"continue" } as ContinueVal
        case "BreakStatement":
            return { type:"break",value:"break" } as BreakVal
        case "ArrayLiteral":
            return evalArrayExpr(astNode as ArrayLiteral,env)
        
        default:
            console.log(astNode)
            throw `ASTNode not implemented yet`
    }
}

