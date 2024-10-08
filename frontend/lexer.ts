import { KEYWORDS, Token, TOKENMAP, TokenType } from "./tokenDefinitions.ts";
function makeToken(value = "", type: TokenType, line: number): Token {
  return { value, type, line };
}
//Checks if character's ASCII value is in the english alphabet or an underscore or digit
function isValidIdentifier(str: string) {
  const char = str.charCodeAt(0);
  if (
    ((char >= 91 && char <= 96) || char < 65 || char > 122) && char != 95 &&
    !isInt(str)
  ) return false;
  return true;
}
//Checks if character's ASCII value is within the digits 0-9
function isInt(str: string) {
  return str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57;
}
function isSkippable(str: string) {
  return str === " " || str === "\n" || str === `\t` || str === "\r" ||
    str.charCodeAt(0) === 160;
}
export function tokenize(src: string): Token[] {
  const tokens = new Array<Token>();
  let line = 0;
  for (let i = 0; i < src.length; i++) {
    const oneCharTokens = src[i];
    const twoCharTokens = src[i] + src[i + 1];
    const threeCharTokens = src[i] + src[i + 1] + src[i + 2];
    const oneCharVal = TOKENMAP[oneCharTokens];
    const twoCharVal = TOKENMAP[twoCharTokens];
    const threeCharVal = TOKENMAP[threeCharTokens];
    if (src[i] === "\n") line++;
    if (isSkippable(src[i])) {
      continue;
    } else if (isInt(src[i])) {
      let num = "";
      let hasDecimal = false;
      // validates decimals
      for (let j = i; j < src.length; j++) {
        if (!isInt(src[j])) {
          if (src[j] === "." && hasDecimal) break;
          else if (src[j] === ".") hasDecimal = true;
          else break;
        }
        num += src[j];
      }
      i += num.length - 1;
      tokens.push(makeToken(num, TokenType.Number, line));
    } else if (isValidIdentifier(src[i])) {
      let ident = "";
      for (let j = i; j < src.length; j++) {
        // if identifier starts with a digit it is invalid
        if (i === j && isInt(src[j])) break;
        if (!isValidIdentifier(src[j])) break;
        ident += src[j];
      }
      i += ident.length - 1;
      const reserved = KEYWORDS[ident];
      //Checks if identifier is a reserved keyword
      if (reserved != undefined) tokens.push(makeToken(ident, reserved, line));
      // Unrecognized identifier means it is a user defined symbol.
      else tokens.push(makeToken(ident, TokenType.Identifier, line));
    } else if (threeCharVal) {
      tokens.push(makeToken(threeCharTokens, threeCharVal, line));
      i += 2;
    } else if (twoCharVal) {
      tokens.push(makeToken(twoCharTokens, twoCharVal, line));
      i++;
    } else if (oneCharVal) {
      if (oneCharVal === TokenType.Comment) {
        i++;
        // validates comments
        while (TOKENMAP[src[i]] !== TokenType.Comment && i < src.length) i++;
        if (TOKENMAP[src[i]] !== TokenType.Comment) {
          throw `Missing End of Comment`;
        }
      } else if (oneCharVal === TokenType.QuotationMark) {
        tokens.push(makeToken(oneCharTokens, oneCharVal, line));
        let str = "";
        i++;
        while (TOKENMAP[src[i]] !== TokenType.QuotationMark && i < src.length) {
          str += src[i];
          i++;
        }
        tokens.push(makeToken(str, TokenType.Identifier, line));
        // adds " token
        tokens.push(makeToken(src[i], TOKENMAP[src[i]], line));
      } else tokens.push(makeToken(oneCharTokens, oneCharVal, line));
    } else {
      throw `Lexing error unknown token, ${oneCharTokens} `;
    }
  }
  tokens.push(makeToken("EndOfFile", TokenType.EOF, line));
  return tokens;
}
