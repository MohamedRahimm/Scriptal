export enum TokenType {
    //Primative types
    Number,
    Null,
    Boolean,

    Identifier,
    Equals,
    OpenParen,
    CloseParen,
    BinaryOperator,
    QuotationMark,


    const,
    Str,
    Bool,
    Any,
    Int,
    Float,



    Semicolon,
    AssignmentOperator,
    EOF
};

const TOKENIZER: Record<string, TokenType> = {
    '"': TokenType.QuotationMark,
    '(': TokenType.OpenParen,
    ')': TokenType.CloseParen,
    '+': TokenType.BinaryOperator,
    '-': TokenType.BinaryOperator,
    '/': TokenType.BinaryOperator,
    '//': TokenType.BinaryOperator,
    '*': TokenType.BinaryOperator,
    '**': TokenType.BinaryOperator,
    '%': TokenType.BinaryOperator,
    '=': TokenType.Equals,
    ';': TokenType.Semicolon,
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
    "const": TokenType.const,
    "int": TokenType.Int,
    "bool": TokenType.Bool,
    "float": TokenType.Float,
    "any": TokenType.Any,
    "str": TokenType.Str,
}

export interface Token {
    value: string,
    type: TokenType
};

function token(value = "", type: TokenType): Token {
    return { value, type }
}

function isAlpha(str: string) {
    let char = str.charCodeAt(0)
    if ((char >= 91 && char <= 96) || char < 65 || char > 122) return false
    return true
}

function isInt(str: string) {
    return str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57
}

function isSkippible(str: string) {
    return str === ' ' || str === '\n' || str === `\t`
}
export function tokenize(src: string): Token[] {
    const tokens = new Array<Token>();
    for (let i = 0; i < src.length; i++) {
        //ADD CHAR LOCATION TO TOKENS
        //Single character tokens
        if (isSkippible(src[i])) continue
        // Assignment Operators
        else if (src[i] === "+" || src[i] === "-" || src[i] === "*" || src[i] === "/" || src[i] === "%") {
            //+= -= *= /=
            if (src[i + 1] === "=") {
                if (TOKENIZER[src[i] + src[i + 1]] != undefined) {
                    let prev = tokens[tokens.length - 1]
                    tokens.push(token("=", TokenType.Equals))
                    tokens.push(prev)
                    tokens.push(token(src[i], TOKENIZER[src[i]]))
                }
                i++
            }
            // ** //
            else if (src[i] === src[i + 1] && TOKENIZER[src[i] + src[i + 1]] != undefined) {
                // **= //=
                if (src[i + 2] === '=') {
                    let prev = tokens[tokens.length - 1]
                    tokens.push(token("=", TokenType.Equals))
                    tokens.push(prev)
                    tokens.push(token(src[i] + src[i + 1], TOKENIZER[src[i] + src[i + 1]]))
                    i++
                }
                else {
                    tokens.push(token(src[i] + src[i + 1], TOKENIZER[src[i] + src[i + 1]]))
                }
                i++
            }

            else if (TOKENIZER[src[i]] != undefined) tokens.push(token(src[i], TOKENIZER[src[i]]))
        }
        else if (TOKENIZER[src[i]] != undefined) tokens.push(token(src[i], TOKENIZER[src[i]]))

        //Multi char tokens
        else if (isInt(src[i])) {
            let num = "";
            for (let j = i; j < src.length; j++) {
                if (isInt(src[j]) === false) break
                num += src[j]
            }
            i += num.length - 1
            tokens.push(token(num, TokenType.Number));
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
                tokens.push(token(ident, reserved));
            } else {
                // Unreconized name must mean user defined symbol.
                tokens.push(token(ident, TokenType.Identifier));
            }
        }
        else {
            console.log('UNRECOGNIZED', src[i])
            break
        }
    }
    tokens.push(token('EndOfFile', TokenType.EOF))
    return tokens
}
// console.log(tokenize(`"168420ehfuefo//**ehfefj*"`))
// console.log(tokenize(`bool x = 100;`))


