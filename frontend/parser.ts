import { ObjectLiteral } from './ast.ts';
import { MemberExpr } from './ast.ts';
import { CallExpr } from './ast.ts';
import { Statement, Program, BinaryExpr, NumericLiteral, Identifier, VarDeclaration, AssignmentExpr, Null, Boolean, String, Property } from './ast.ts'
import { Token, TokenType, tokenize } from './lexer.ts'
export class Parser {
    private tokens: Token[] = []
    idx!: number;
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
            case TokenType.Const:
            case TokenType.Int:
            case TokenType.Bool:
            case TokenType.Float:
            case TokenType.Any:
            case TokenType.Str:
            case TokenType.Obj:
                return this.parseVarDec()
            default:
                return this.parseExpr()

        }
    }
    private parseVarDec(): Statement {
        let isConstant = false
        if (this.at().type == TokenType.Const) {
            isConstant = true
            this.eat()
        }
        const validUserValTypes = new Set<TokenType>([TokenType.Any, TokenType.Bool, TokenType.Str, TokenType.Float, TokenType.Int,TokenType.Obj])
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
    private parseExpr(): Statement {
        return this.parseAssignmentExpr()
    }
    private parseAssignmentExpr(): Statement {
        const left = this.parseLogicalExpr()
        if (this.at().type == TokenType.Equals) {
            this.eat()
            const value = this.parseAssignmentExpr()
            return { value, assignee: left, kind: "AssignmentExpr" } as AssignmentExpr
        }
        return left
    }
    private parseLogicalExpr(): Statement{
        let left = this.parseObjectExpr()
        while (this.at().value === "||"||this.at().value === "&&") {
            const operator = this.eat().value
            const right = this.parseObjectExpr()
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseObjectExpr():Statement {
      if(this.at().type!==TokenType.OpenBrace){
        return this.parseAdditiveExpr()
      }
      this.eat()
      const properties = new Array<Property>()
      while(this.at().type!==TokenType.EOF && this.at().type!==TokenType.CloseBrace){
        const key = this.expect(TokenType.Identifier, "Invalid key for object").value
        // allows {key,...}
        if(this.at().type==TokenType.Comma){
            this.eat()
            properties.push({key,kind:"Property"} as Property)
            continue
        }
        //allows {key}
        else if(this.at().type===TokenType.CloseBrace){
            properties.push({key,kind:"Property"} as Property)
            continue
        }
        this.expect(TokenType.Colon,"Expected Colon")
        const value = this.parseExpr()
        properties.push({kind:"Property",value,key} as Property)
        if(this.at().type!==TokenType.CloseBrace){
            this.expect(TokenType.Comma, "Expected comma or Closing Bracket following property")
          }
      }
      
      this.expect(TokenType.CloseBrace, "Unclosed Brackets")
      return {kind: "ObjectLiteral",properties} as ObjectLiteral
    }
    private parseAdditiveExpr(): Statement {
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
    private parseMultiplicativeExpr(): Statement {
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
    private parseExponentExpr(): Statement {
        let left = this.parseCallMemberExpr()
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
    //foo.x()
    private parseCallMemberExpr():Statement {
      const member  = this.parseMemberExpr()
      if(this.at().type==TokenType.OpenParen){
        return this.parseCallExpr(member)
      }
      return member
    }
    private parseCallExpr(caller:Statement):Statement {
      let callExpr:Statement = {
        kind: "CallExpr",
        caller,
        args: this.parseArgs()
      } as CallExpr
      if(this.at().type == TokenType.OpenParen){
        callExpr = this.parseCallExpr(callExpr)
      }
      return callExpr
    }
    private parseArgs():Statement[] {
      this.expect(TokenType.OpenParen, "Expected open parenthesis")
      const args = this.at().type == TokenType.CloseParen
        ? []
        : this.parseArgsList()
        this.expect(TokenType.CloseParen,"Missing closing parenthesis inside argument list")
        return args
    }
    private parseArgsList():Statement[] {
      const args = [this.parseAssignmentExpr()]
      while(this.at().type !== TokenType.EOF && this.at().type ===TokenType.Comma){
        this.eat()
        args.push(this.parseAssignmentExpr())
      }
      return args
    }
    private parseMemberExpr():Statement {
      let object = this.parsePrimaryExpr()
      while(this.at().type ===TokenType.Dot || this.at().type === TokenType.OpenBracket){
        const operator = this.eat()
        let property:Statement;
        let computed:boolean;
        if(operator.type==TokenType.Dot){
            computed =false
            property = this.parsePrimaryExpr()
            if(property.kind!=="Identifier") throw `Cannot use dot op without rhs being an identifier`
        }
        else{
            computed = true
            property = this.parseExpr()
            this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value")
        }
        object = {kind: "MemberExpr", object,property,computed} as MemberExpr

      }
      return object
    }
    private parsePrimaryExpr(): Statement {
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
            case TokenType.QuotationMark:{
                let value = ""
                this.eat()
                while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.QuotationMark) {
                    value += this.eat().value
                }
                this.expect(TokenType.QuotationMark, "Unclosed Quote")
                return { kind: "String", value } as String
            }
            case TokenType.OpenParen:{
                this.eat()
                const value = this.parseExpr()
                this.expect(TokenType.CloseParen, "Unclosed Parenthesis")
                return value
            }
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