export enum TokenType {
  //Primitive types
  Number,
  Null,
  Boolean,
  Identifier,

  //Operators
  Equals,
  OpenParen,
  CloseParen,
  Comma,
  OpenBracket,
  CloseBracket,
  Dot,
  AssignmentOperator,
  BinaryOperator,
  Equality,
  Inequality,
  LessThan,
  GreaterThan,
  LessOrEqual,
  GreaterOrEqual,

  //Var Types
  Const,
  Let,
  Function,
  Unassigned,

  //Conditionals/Loops
  If,
  Else,
  While,
  For,

  //Miscellaneous
  Colon,
  OpenBrace,
  CloseBrace,
  QuotationMark,
  Comment,
  Return,
  Continue,
  Break,

  // End of file/statement
  Semicolon,
  EOF,
}
export const TOKENMAP: Record<string, TokenType> = {
  '"': TokenType.QuotationMark,
  "(": TokenType.OpenParen,
  ")": TokenType.CloseParen,
  "{": TokenType.OpenBrace,
  "}": TokenType.CloseBrace,
  "[": TokenType.OpenBracket,
  "]": TokenType.CloseBracket,
  ":": TokenType.Colon,
  ",": TokenType.Comma,
  ".": TokenType.Dot,
  "=": TokenType.Equals,
  ";": TokenType.Semicolon,
  "+": TokenType.BinaryOperator,
  "-": TokenType.BinaryOperator,
  "`": TokenType.Comment,
  "<": TokenType.LessThan,
  ">": TokenType.GreaterThan,
  "^": TokenType.BinaryOperator,
  "<=": TokenType.LessOrEqual,
  ">=": TokenType.GreaterOrEqual,
  "&&": TokenType.BinaryOperator,
  "||": TokenType.BinaryOperator,
  "==": TokenType.Equality,
  "!=": TokenType.Inequality,
  "/": TokenType.BinaryOperator,
  "//": TokenType.BinaryOperator,
  "*": TokenType.BinaryOperator,
  "%": TokenType.BinaryOperator,
  "+=": TokenType.AssignmentOperator,
  "-=": TokenType.AssignmentOperator,
  "*=": TokenType.AssignmentOperator,
  "/=": TokenType.AssignmentOperator,
  "%=": TokenType.AssignmentOperator,
  "^=": TokenType.AssignmentOperator,
  "//=": TokenType.AssignmentOperator,
};
export const KEYWORDS: Record<string, TokenType> = {
  "null": TokenType.Null,
  "true": TokenType.Boolean,
  "false": TokenType.Boolean,
  "const": TokenType.Const,
  "let": TokenType.Let,
  "unassigned": TokenType.Unassigned,
  "function": TokenType.Function,
  "if": TokenType.If,
  "else": TokenType.Else,
  "for": TokenType.For,
  "while": TokenType.While,
  "return": TokenType.Return,
  "continue": TokenType.Continue,
  "break": TokenType.Break,
};
export interface Token {
  value: string;
  type: TokenType;
  line: number;
}
