import { ValueType, RuntimeVal, NullVal, BoolVal, StringVal } from "./values.ts";
import { BinaryExpr, NodeType, NumericLiteral, Statement, Program, Identifier, VarDeclaration, AssignmentExpr, Boolean, Null, String } from "../ast.ts"
import Environment from "./environment.ts";
import { evalIdentifier, evalBinaryExpr, evalAssignment, evalNumericLiteral, } from "./eval/expressions.ts";
import { evalProgram, evalVarDeclaration } from "./eval/statements.ts"


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
        case "Identifier":
            return evalIdentifier(astNode as Identifier, env)
        case "BinaryExpr":
            return evalBinaryExpr(astNode as BinaryExpr, env)
        case "Program":
            return evalProgram(astNode as Program, env)
        case "VarDeclaration":
            return evalVarDeclaration(astNode as VarDeclaration, env)
        case "AssignmentExpr":
            return evalAssignment(astNode as AssignmentExpr, env)
        default:
            console.log('ASTNode not implemented yet', astNode)
            throw Error()
    }
}

