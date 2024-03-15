export type NodeType =
  | "Program"
  | "NumericLiteral"
  | "Identifier"
  | "BinaryExpr"
  | "UnaryExpr"
  | "VarDeclaration"
  | "AssignmentExpr"
  | "StringLiteral"
  | "Null"
  | "Boolean"
  | "Property"
  | "ObjectLiteral"
  | "MemberExpr"
  | "CallExpr"
  | "FunctionDeclaration"
  | "IfStmt"
  | "ForStmt"
  | "WhileStmt"
  | "Unassigned"
  | "BreakStmt"
  | "ContStmt"
  | "ReturnStmt"
  | "ArrayLiteral";

export interface Stmt {
  kind: NodeType;
}
export interface Program extends Stmt {
  kind: "Program";
  body: Stmt[];
}
export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration";
  constant: boolean;
  identifier: string;
  value?: Stmt;
}

export interface FunctionDeclaration extends Stmt {
  kind: "FunctionDeclaration";
  parameters: string[];
  name: string;
  body: Stmt[];
}
export interface IfStmt extends Stmt {
  kind: "IfStmt";
  body: Stmt[];
  condition: Stmt;
  elseExpr?: Stmt[];
}
export interface ForStmt extends Stmt {
  kind: "ForStmt";
  body: Stmt[];
  initVar: VarDeclaration;
  iteration: AssignmentExpr;
  condition: Stmt;
}
export interface WhileStmt extends Stmt {
  kind: "WhileStmt";
  body: Stmt[];
  condition: Stmt;
}

export interface AssignmentExpr extends Stmt {
  kind: "AssignmentExpr";
  assignee: Stmt;
  value: Stmt;
}
export interface BinaryExpr extends Stmt {
  kind: "BinaryExpr";
  left: Stmt;
  right: Stmt;
  operator: string;
}
export interface ObjectLiteral extends Stmt {
  kind: "ObjectLiteral";
  properties: Property[];
}
export interface ArrayLiteral extends Stmt {
  kind: "ArrayLiteral";
  elements: Stmt[];
  methods: Property[];
}
export interface StringLiteral extends Stmt {
  kind: "StringLiteral";
  value: string;
  methods: Property[];
}
export interface Property extends Stmt {
  kind: "Property";
  key: string;
  value?: Stmt;
}

export interface UnaryExpr extends Stmt {
  kind: "UnaryExpr";
  right: Stmt;
  operator: string;
}

export interface CallExpr extends Stmt {
  kind: "CallExpr";
  args: Stmt[];
  caller: Stmt;
}
export interface MemberExpr extends Stmt {
  kind: "MemberExpr";
  object: Stmt;
  property: Stmt;
  computed: boolean;
}

export interface Identifier extends Stmt {
  kind: "Identifier";
  symbol: string;
}
export interface NumericLiteral extends Stmt {
  kind: "NumericLiteral";
  value: number;
}
export interface Null extends Stmt {
  kind: "Null";
  value: null;
}
export interface Boolean extends Stmt {
  kind: "Boolean";
  value: boolean;
}
export interface Unassigned extends Stmt {
  kind: "Unassigned";
  value: "unassigned";
}
export interface TermStmt extends Stmt {
  kind: "BreakStmt" | "ContStmt";
}

export interface ReturnStmt extends Stmt {
  kind: "ReturnStmt";
  value: Stmt;
}
