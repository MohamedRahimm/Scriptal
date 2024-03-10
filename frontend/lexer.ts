export enum TokenType {
  //Primative types
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
const TOKENMAP: Record<string, TokenType> = {
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
const KEYWORDS: Record<string, TokenType> = {
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
}
function makeToken(value = "", type: TokenType): Token {
  return { value, type };
}
//Checks if character's ASCII value is in the english alphabet
function isAlpha(str: string) {
  const char = str.charCodeAt(0);
  if ((char >= 91 && char <= 96) || char < 65 || char > 122) return false;
  return true;
}
//Checks if character's ASCII value is within the digits 0-9
function isInt(str: string) {
  return str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57;
}
function isSkippible(str: string) {
  return str === " " || str === "\n" || str === `\t` || str === "\r";
}
export function tokenize(src: string): Token[] {
  const tokens = new Array<Token>();
  for (let i = 0; i < src.length; i++) {
    const oneCharTokens = src[i];
    const twoCharTokens = src[i] + src[i + 1];
    const threeCharTokens = src[i] + src[i + 1] + src[i + 2];
    const oneCharVal = TOKENMAP[oneCharTokens];
    const twoCharVal = TOKENMAP[twoCharTokens];
    const threeCharVal = TOKENMAP[threeCharTokens];
    if (isSkippible(src[i])) continue;
    else if (isInt(src[i])) {
      let num = "";
      let hasDecimal = false;
      for (let j = i; j < src.length; j++) {
        if (!isInt(src[j])) {
          if (src[j] === "." && hasDecimal) break;
          else if (src[j] === ".") hasDecimal = true;
          else break;
        }
        num += src[j];
      }
      i += num.length - 1;
      tokens.push(makeToken(num, TokenType.Number));
    } else if (isAlpha(src[i])) {
      let ident = "";
      for (let j = i; j < src.length; j++) {
        if (!isAlpha(src[j])) break;
        ident += src[j];
      }
      i += ident.length - 1;
      const reserved = KEYWORDS[ident];
      //Checks if identifier is a reserved keyword
      if (reserved != undefined) tokens.push(makeToken(ident, reserved));
      // Unreconized identifier means it is a user defined symbol.
      else tokens.push(makeToken(ident, TokenType.Identifier));
    } else if (threeCharVal) {
      if (threeCharVal === TokenType.AssignmentOperator) {
        const prev = tokens[tokens.length - 1];
        tokens.push(makeToken("=", TokenType.Equals));
        tokens.push(prev);
        tokens.push(makeToken(twoCharTokens, twoCharVal));
      } else tokens.push(makeToken(threeCharTokens, threeCharVal));
      i += 2;
    } else if (twoCharVal) {
      if (twoCharVal === TokenType.AssignmentOperator) {
        const prev = tokens[tokens.length - 1];
        tokens.push(makeToken("=", TokenType.Equals));
        tokens.push(prev);
        tokens.push(makeToken(oneCharTokens, oneCharVal));
      } else tokens.push(makeToken(twoCharTokens, twoCharVal));
      i++;
    } else if (oneCharVal) {
      if (oneCharVal === TokenType.Comment) {
        i++;
        while (TOKENMAP[src[i]] !== TokenType.Comment && i < src.length) i++;
        if (TOKENMAP[src[i]] !== TokenType.Comment) {
          throw `Missing End of Comment`;
        }
      } else if (oneCharVal === TokenType.QuotationMark) {
        tokens.push(makeToken(oneCharTokens, oneCharVal));
        let str = "";
        i++;
        while (TOKENMAP[src[i]] !== TokenType.QuotationMark && i < src.length) {
          str += src[i];
          i++;
        }
        tokens.push(makeToken(str, TokenType.Identifier));
        tokens.push(makeToken(src[i], TOKENMAP[src[i]]));
      } else tokens.push(makeToken(oneCharTokens, oneCharVal));
    } else {
      throw `Lexing error unknown token, ${oneCharTokens} `;
    }
  }
  tokens.push(makeToken("EndOfFile", TokenType.EOF));
  return tokens;
}
