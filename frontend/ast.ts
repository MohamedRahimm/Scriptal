export type NodeType =
    | "Program"
    | 'NumericLiteral'
    | 'Identifier'
    | 'BinaryExpr'
    | 'VarDeclaration'
    | 'AssignmentExpr'
    | "String"
    | 'Any'
    | "Null"
    | "Boolean"
    | "Bool"
    | "Property"
    | "ObjectLiteral"
    | "MemberExpr"
    | "CallExpr"
    | "Or"
    | "And"
    | "FunctionDeclaration"
    | "IfExpr"
    | "ForExpr"
    | "WhileExpr"
    | "Unassigned"
    | "BreakStatement"
    | "ContinueStatement"
    |"ReturnStatement"
    | "ArrayLiteral"


export interface Statement {
    kind: NodeType
}
export interface Program extends Statement {
    kind: 'Program'
    body: Statement[]
}
export interface VarDeclaration extends Statement {
    kind: 'VarDeclaration'
    constant: boolean,
    identifier: string,
    valueType: string,
    value?: Statement,
    any: boolean
}
export interface FunctionDeclaration extends Statement {
    kind: 'FunctionDeclaration'
    parameters: string[]
    name: string,
    body: Statement[]
}


export interface AssignmentExpr extends Statement {
    kind: "AssignmentExpr",
    assignee: Statement,
    value: Statement,
    valueType: string
}

export interface CallExpr extends Statement {
    kind: 'CallExpr'
    args: Statement[],
    caller: Statement,
}
export interface MemberExpr extends Statement {
    kind: 'MemberExpr'
    object: Statement,
    property: Statement,
    computed: boolean
}
export interface BinaryExpr extends Statement {
    kind: 'BinaryExpr'
    left: Statement,
    right: Statement,
    operator: string
}
export interface IfExpr extends Statement {
    kind: 'IfExpr'
    body: Statement[]
    condition: Statement
    elseExpr?: Statement[]
    
}
export interface ForExpr extends Statement {
    kind: 'ForExpr'
    body: Statement[]
    initVar: VarDeclaration
    iteration: AssignmentExpr
    condition: Statement
    
}
export interface WhileExpr extends Statement {
    kind: 'WhileExpr'
    body: Statement[]
    condition: Statement
}
export interface Identifier extends Statement {
    kind: 'Identifier'
    symbol: string
}
export interface NumericLiteral extends Statement {
    kind: "NumericLiteral"
    value: number
}
export interface Null extends Statement {
    kind: "Null"
    value: null
}
export interface Boolean extends Statement {
    kind: "Boolean"
    value: boolean
}
export interface Unassigned extends Statement {
    kind: "Unassigned"
    value: "unassigned"
}
export interface Bool extends Statement {
    kind: "Bool"
    value: boolean
}

export interface Any extends Statement {
    kind: 'Any'
    // deno-lint-ignore no-explicit-any
    value: any
}

export interface String extends Statement {
    kind: "String",
    value: string
}
export interface Property extends Statement {
    kind: "Property",
    key: string,
    value?: Statement,
}
export interface ObjectLiteral extends Statement {
    kind: "ObjectLiteral",
    properties: Property[]
}
export interface BreakStatement extends Statement{
    kind: "BreakStatement"
}
export interface ContinueStatement extends Statement{
    kind: "ContinueStatement"
}
export interface ReturnStatement extends Statement{
    kind: "ReturnStatement"
    value: Statement
}
export interface ArrayLiteral extends Statement{
    kind: "ArrayLiteral",
    value: Statement[]
}