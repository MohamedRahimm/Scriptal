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
    value?: Expr,
    any: boolean
}
export interface Expr extends Statement {

}


export interface AssignmentExpr extends Expr {
    kind: "AssignmentExpr",
    assignee: Expr,
    value: Expr,
    valueType: string
}
export interface BinaryExpr extends Expr {
    kind: 'BinaryExpr'
    left: Expr,
    right: Expr,
    operator: string
}
export interface Identifier extends Expr {
    kind: 'Identifier'
    symbol: string
}
export interface NumericLiteral extends Expr {
    kind: "NumericLiteral"
    value: number
}
export interface Null extends Expr {
    kind: "Null"
    value: null
}
export interface Boolean extends Expr {
    kind: "Boolean"
    value: boolean
}
export interface Bool extends Expr {
    kind: "Bool"
    value: boolean
}

export interface Any extends Expr {
    kind: 'Any'
    value: any
}

export interface String extends Expr {
    kind: "String",
    value: string
}
