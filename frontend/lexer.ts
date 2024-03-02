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
    Or,
    And,
    Equality,
    Inequality,
    LessThan,
    GreaterThan,
    LessOrEqual,
    GreaterOrEqual,

    //Var Types
    Const,
    Str,
    Bool,
    Any,
    Int,
    Float,
    Obj,

    //Miscellaneous
    Colon,
    OpenBrace,
    CloseBrace,
    QuotationMark,

    // End of file/statement
    Semicolon,
    EOF
};

const TOKENMAP: Record<string, TokenType> = {
    '"': TokenType.QuotationMark,
    '(': TokenType.OpenParen,
    ')': TokenType.CloseParen,
    '{': TokenType.OpenBrace,
    '}': TokenType.CloseBrace,
    '[': TokenType.OpenBracket,
    ']': TokenType.CloseBracket,
    ':': TokenType.Colon,
    ',': TokenType.Comma,
    '.': TokenType.Dot,
    '=': TokenType.Equals,
    ';': TokenType.Semicolon,
    '+': TokenType.BinaryOperator,
    '-': TokenType.BinaryOperator,
    '<' : TokenType.LessThan,
    '>': TokenType.GreaterThan,
    '<=': TokenType.LessOrEqual,
    '>=': TokenType.GreaterOrEqual,
    '&&':TokenType.BinaryOperator,
    '||':TokenType.BinaryOperator,
    '==':TokenType.Equality,
    '!=':TokenType.Inequality,
    '/': TokenType.BinaryOperator,
    '//': TokenType.BinaryOperator,
    '*': TokenType.BinaryOperator,
    '**': TokenType.BinaryOperator,
    '%': TokenType.BinaryOperator,
    "+=": TokenType.AssignmentOperator,
    '-=': TokenType.AssignmentOperator,
    '*=': TokenType.AssignmentOperator,
    '/=': TokenType.AssignmentOperator,
    '%=': TokenType.AssignmentOperator,
    "//=": TokenType.AssignmentOperator,
    "**=": TokenType.AssignmentOperator,
}


const KEYWORDS: Record<string, TokenType> = {
    "null": TokenType.Null,
    "true": TokenType.Boolean,
    "false": TokenType.Boolean,
    "const": TokenType.Const,
    "int": TokenType.Int,
    "bool": TokenType.Bool,
    "float": TokenType.Float,
    "any": TokenType.Any,
    "str": TokenType.Str,
    "obj":TokenType.Obj,
}

export interface Token {
    value: string,
    type: TokenType
};

function makeToken(value = "", type: TokenType): Token {
    return { value, type }
}

function isAlpha(str: string) {
    const char = str.charCodeAt(0)
    if ((char >= 91 && char <= 96) || char < 65 || char > 122) return false
    return true
}

function isInt(str: string) {
    return str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57
}

function isSkippible(str: string) {
    return str === ' ' || str === '\n' || str === `\t` || str === "\r"
}
export function tokenize(src: string): Token[] {
    const tokens = new Array<Token>();
    for (let i = 0; i < src.length; i++) {
        //ADD CHAR LOCATION TO TOKENS
        //Single character tokens
        const oneCharTokens = src[i]
        const twoCharTokens = src[i] + src[i+1]
        const threeCharTokens = src[i] + src[i+1] + src[i+2]
        if (isSkippible(src[i])) continue

        //Multi char tokens
        else if (isInt(src[i])) {
            let num = "";
            for (let j = i; j < src.length; j++) {
                if (isInt(src[j]) === false) break
                num += src[j]
            }
            i += num.length - 1
            tokens.push(makeToken(num, TokenType.Number));
        }
        else if (isAlpha(src[i])) {
            let ident = "";
            for (let j = i; j < src.length; j++) {
                if (isAlpha(src[j]) === false) break
                ident += src[j]
            }
            i += ident.length - 1
            const reserved = KEYWORDS[ident];
            if (reserved != undefined) {
                tokens.push(makeToken(ident, reserved));
            } else {
                // Unreconized name must mean user defined symbol.
                tokens.push(makeToken(ident, TokenType.Identifier));
            }
        }
        else if(TOKENMAP[threeCharTokens]!=undefined){
            if(TOKENMAP[threeCharTokens]===TokenType.AssignmentOperator){
                const prev = tokens[tokens.length - 1]
                tokens.push(makeToken("=", TokenType.Equals))
                tokens.push(prev)
                tokens.push(makeToken(twoCharTokens, TOKENMAP[twoCharTokens]))
            }
            else tokens.push(makeToken(threeCharTokens, TOKENMAP[threeCharTokens]))
            i+=2
        }
        
        else if(TOKENMAP[twoCharTokens]!=undefined){
            if(TOKENMAP[twoCharTokens]===TokenType.AssignmentOperator){
                const prev = tokens[tokens.length - 1]
                tokens.push(makeToken("=", TokenType.Equals))
                tokens.push(prev)
                tokens.push(makeToken(oneCharTokens, TOKENMAP[oneCharTokens]))
            }
            else tokens.push(makeToken(twoCharTokens, TOKENMAP[twoCharTokens]))
            i++
        }
        
        else if(TOKENMAP[oneCharTokens]){
            tokens.push(makeToken(oneCharTokens, TOKENMAP[oneCharTokens]))
        }

        else {
            throw `Uncrecognized makeToken ${oneCharTokens}`
        }
    }
    tokens.push(makeToken('EndOfFile', TokenType.EOF))
    return tokens
}



