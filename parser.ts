import { Statement, Program, Expr, BinaryExpr, NumericLiteral, Identifier, VarDeclaration, AssignmentExpr, Null, Boolean, String, Bool } from './ast.ts'
import { Token, TokenType, tokenize } from './lexer.ts'
export class Parser {
    private tokens: Token[] = []
    idx: number
    private at() {
        return this.tokens[this.idx] as Token
    }
    private eat() {
        return this.tokens[this.idx++] as Token
    }
    private expect(expectedVal: TokenType, errorMsg: string) {
        const prev = this.tokens[this.idx++]
        if (prev.type !== expectedVal) throw `expected ${expectedVal} got ${prev.type} at char ${prev.value} ERROR MSG ${errorMsg}`
        return prev as Token
    }
    private parseStatement(): Statement {
        switch (this.at().type) {
            case TokenType.const:
            case TokenType.Int:
            case TokenType.Bool:
            case TokenType.Float:
            case TokenType.Any:
            case TokenType.Str:
                return this.parseVarDec()
            default:
                return this.parseExpr()

        }
    }
    private parseVarDec(): Statement {
        let isConstant = false
        if (this.at().type == TokenType.const) {
            isConstant = true
            this.eat()
        }
        const validUserValTypes = new Set<TokenType>([TokenType.Any, TokenType.Bool, TokenType.Str, TokenType.Float, TokenType.Int])
        if (validUserValTypes.has(this.at().type) == false) throw `invalid var declaration type supported types are str etc...`
        const userValType = this.eat().value
        const identifier = this.expect(TokenType.Identifier, "Invalid var name").value
        this.expect(
            TokenType.Equals,
            "Expected equals token following identifier in var declaration.",
        );
        const declaration = {
            kind: "VarDeclaration",
            value: this.parseExpr(),
            constant: isConstant,
            identifier,
            valueType: userValType,
            any: userValType === "any"
        } as VarDeclaration

        return declaration

    }
    private parseExpr(): Expr {
        return this.parseAssignmentExpr()
    }
    private parseAssignmentExpr(): Expr {
        const left = this.parseAdditiveExpr()
        if (this.at().type == TokenType.Equals) {
            this.eat()
            const value = this.parseAssignmentExpr()
            return { value, assignee: left, kind: "AssignmentExpr" } as AssignmentExpr
        }
        return left
    }
    private parseAdditiveExpr(): Expr {
        let left = this.parseMultiplicativeExpr()
        while (this.at().value === "+" || this.at().value === '-') {
            const operator = this.eat().value
            const right = this.parseMultiplicativeExpr()
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseMultiplicativeExpr(): Expr {
        let left = this.parseExponentExpr()
        while (this.at().value === "/" || this.at().value === '*' || this.at().value === "%" || this.at().value === "//") {
            const operator = this.eat().value
            const right = this.parseExponentExpr()
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseExponentExpr(): Expr {
        let left = this.parsePrimaryExpr()
        while (this.at().value === "**") {
            const operator = this.eat().value
            const right = this.parsePrimaryExpr()
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parsePrimaryExpr(): Expr {
        const token = this.at()
        switch (token.type) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value
                } as Identifier
            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value)
                } as NumericLiteral
            case TokenType.Null:
                this.eat()
                return {
                    kind: "Null",
                    value: null
                } as Null
            case TokenType.Boolean:
                return {
                    kind: "Boolean",
                    value: this.eat().value === "true"
                } as Boolean
            case TokenType.QuotationMark:
                let value = ""
                this.eat()
                while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.QuotationMark) {
                    value += this.eat().value
                }
                this.expect(TokenType.QuotationMark, "Unclosed Quote")
                return { kind: "String", value } as String
            case TokenType.OpenParen:
                this.eat()
                const val = this.parseExpr()
                this.expect(TokenType.CloseParen, "Unclosed Parenthesis")
                return val
            default:
                console.log('Dont know this token', token)
                throw Error()
        }
    }
    produceAst(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode)
        this.idx = 0
        const program: Program = {
            kind: 'Program',
            body: []
        }
        while (this.at().type !== TokenType.EOF) {
            program.body.push(this.parseStatement())
            this.expect(TokenType.Semicolon, "Missing ;")
        }
        return program
    }
}