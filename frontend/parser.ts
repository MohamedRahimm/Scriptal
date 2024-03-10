import { ArrayLiteral, ObjectLiteral, Unassigned, WhileExpr } from './ast.ts';
import { MemberExpr } from './ast.ts';
import { ReturnStatement,ContinueStatement,BreakStatement } from './ast.ts';

import { CallExpr,FunctionDeclaration,IfExpr,ForExpr } from './ast.ts';
import { Statement, Program, BinaryExpr,UnaryExpr, NumericLiteral, Identifier, VarDeclaration, AssignmentExpr, Null, Boolean, String, Property } from './ast.ts'
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
    private parseStatement(inFunction=false,inLoop=false): Statement {
        switch (this.at().type) {
            case TokenType.Const:
            case TokenType.Let:
                return this.parseVarDec(inFunction,inLoop)
            case TokenType.Function:
                return this.parseFunctionDec(inFunction,inLoop)
            case TokenType.If:
                return this.parseIfExpr(inFunction,inLoop)
            case TokenType.For:
                return this.parseForExpr(inFunction,inLoop)
            case TokenType.While:
                return this.parseWhileExpr(inFunction,inLoop)
            default:
                return this.parseExpr(inFunction,inLoop)

        }
    }
    private parseBlockStatement(inFunction=false,inLoop=false):Statement[]{
        this.expect(TokenType.OpenBrace, "{ expected")
        const body: Statement[] = []
        while(this.at().type!==TokenType.EOF &&this.at().type!==TokenType.CloseBrace){
            body.push(this.parseStatement(inFunction,inLoop))
            this.expect(TokenType.Semicolon, "; Expected")
           }
        this.expect(TokenType.CloseBrace, "} expected")
        return body
    }
    private parseFunctionDec(inFunction=false,inLoop=false):Statement{
       this.eat()
       const name = this.expect(TokenType.Identifier, "Expected Function name after Function keyword").value
       const args = this.parseArgs() 
       const params:string[] = []
       for(const arg of args){
        if(arg.kind !=="Identifier"){
            throw`Inside function declaration expected parameters to be of type string instead got ${arg}`
        }
        params.push((arg as Identifier).symbol)
       } 
        const body = this.parseBlockStatement(true,inLoop)
       const fn =  {body,name,parameters:params,kind:"FunctionDeclaration"} as FunctionDeclaration
       return fn
    }
    private parseVarDec(inFunction=false,inLoop=false): Statement {
        const isConstant = this.eat().type == TokenType.Const;
		const identifier = this.expect(
			TokenType.Identifier,
			"Expected identifier name following let | const keywords."
		).value;

		if (this.at().type == TokenType.Semicolon) {
			this.eat(); // expect semicolon
			if (isConstant) {
				throw "Must assigne value to constant expression. No value provided.";
			}

			return {
				kind: "VarDeclaration",
				identifier,
				constant: false,
			} as VarDeclaration;
		}

		this.expect(
			TokenType.Equals,
			"Expected equals token following identifier in var declaration."
		);

		const declaration = {
			kind: "VarDeclaration",
			value: this.parseExpr(inFunction,inLoop),
			identifier,
			constant: isConstant,
		} as VarDeclaration;
		return declaration;

    }
    private parseIfExpr(inFunction=false,inLoop=false):Statement{
        this.eat()
        this.expect(TokenType.OpenParen, "Expected ( after keyword if")
        const condition = this.parseExpr(inFunction,inLoop)
        this.expect(TokenType.CloseParen, "Expected )")
        const body = this.parseBlockStatement(inFunction,inLoop)
        if(this.tokens[this.idx+1].type===TokenType.Else){
            this.expect(TokenType.Semicolon, "Expected ;")
        }
        let elseExpr:Statement[] = []
        if(this.at().type==TokenType.Else){
            this.eat()
            if(this.at().type==TokenType.If){
                elseExpr = [this.parseIfExpr(inFunction,inLoop)]
            }
            else elseExpr = this.parseBlockStatement(inFunction,inLoop)
        }
        return{
            kind: "IfExpr",
            body,
            condition,
            elseExpr
        } as IfExpr

    }
    private parseForExpr(inFunction=false,inLoop=false):Statement{
        // consider for(;;)
        this.eat()
        this.expect(TokenType.OpenParen, "Expected (")
        const initVar = this.parseVarDec(inFunction)
        this.expect(TokenType.Semicolon, "Expected ;")
        const condition = this.parseExpr(inFunction)
        this.expect(TokenType.Semicolon, "Expected ;")
        const iteration = this.parseExpr(inFunction)
        this.expect(TokenType.CloseParen, "Expected )")
        const body = this.parseBlockStatement(inFunction,true)
        return {
            kind: "ForExpr",
            initVar,
            condition,
            iteration,
            body
        } as ForExpr
    }
    private parseWhileExpr(inFunction=false,inLoop=false):Statement{
        this.eat()
        this.expect(TokenType.OpenParen, "Expected (")
        const condition = this.parseExpr(inFunction)
        this.expect(TokenType.CloseParen, "Expected )")
        const body = this.parseBlockStatement(inFunction,true)
        return {
            kind: "WhileExpr",
            body,
            condition
        } as WhileExpr
    }
    private parseExpr(inFunction=false,inLoop=false): Statement {
        return this.parseAssignmentExpr(inFunction,inLoop)
    }
    private parseAssignmentExpr(inFunction=false,inLoop=false): Statement {
        const left = this.parseLogicalExpr(inFunction,inLoop)
        if (this.at().type == TokenType.Equals) {
            this.eat()
            const value = this.parseAssignmentExpr(inFunction,inLoop)
            return { value, assignee: left, kind: "AssignmentExpr" } as AssignmentExpr
        }
        return left
    }
    private parseLogicalExpr(inFunction=false,inLoop=false): Statement{
        let left = this.parseRelationalExpr(inFunction,inLoop)
        while (this.at().value === "||"||this.at().value === "&&") {
            const operator = this.eat().value
            const right = this.parseRelationalExpr(inFunction,inLoop)
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseRelationalExpr(inFunction=false,inLoop=false):Statement{
        const left = this.parseEqualityExpr(inFunction,inLoop)
        const RelationalOps = new Set(["<",">","<=",">="])
        if(RelationalOps.has(this.at().value)){
            const operator = this.eat().value
            const right = this.parseEqualityExpr(inFunction,inLoop)
            return{
                kind:"BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseEqualityExpr(inFunction=false,inLoop=false):Statement{
        const left = this.parseObjectExpr(inFunction,inLoop)
        if(this.at().value==="=="||this.at().value=="!="){
            const operator = this.eat().value
            const right = this.parseObjectExpr(inFunction,inLoop)
            return{
                kind:"BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseObjectExpr(inFunction=false,inLoop=false):Statement {
      if(this.at().type!==TokenType.OpenBrace){
        return this.parseAdditiveExpr(inFunction,inLoop)
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
        const value = this.parseExpr(inFunction,inLoop)
        properties.push({kind:"Property",value,key} as Property)
        if(this.at().type!==TokenType.CloseBrace){
            this.expect(TokenType.Comma, "Expected comma or Closing Bracket following property")
          }
      }
      
      this.expect(TokenType.CloseBrace, "Unclosed Brackets")
      return {kind: "ObjectLiteral",properties} as ObjectLiteral
    }
    private parseAdditiveExpr(inFunction=false,inLoop=false): Statement {
        let left = this.parseMultiplicativeExpr(inFunction,inLoop)
        while (this.at().value === "+" || this.at().value === '-') {
            const operator = this.eat().value
            const right = this.parseMultiplicativeExpr(inFunction,inLoop)
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseMultiplicativeExpr(inFunction=false,inLoop=false): Statement {
        let left = this.parseExponentExpr(inFunction,inLoop)
        while (this.at().value === "/" || this.at().value === '*' || this.at().value === "%" || this.at().value === "//") {
            const operator = this.eat().value
            const right = this.parseExponentExpr(inFunction,inLoop)
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseExponentExpr(inFunction=false,inLoop=false): Statement {
        let left = this.parseUnaryExpr(inFunction,inLoop)
        while (this.at().value === "**") {
            const operator = this.eat().value
            const right = this.parseUnaryExpr(inFunction,inLoop)
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }
        return left
    }
    private parseUnaryExpr(inFunction=false,inLoop=false): Statement {
        if(this.at().value==="+"||this.at().value==="-"){
            const op = this.eat().value
            const right = this.parsePrimaryExpr(inFunction,inLoop)
            return {kind:"UnaryExpr",operator:op,right} as UnaryExpr
        }
        return this.parseCallMemberExpr(inFunction,inLoop)
    }
    private parseCallMemberExpr(inFunction=false,inLoop=false):Statement {
      const member  = this.parseMemberExpr(inFunction,inLoop)
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
    private parseMemberExpr(inFunction=false,inLoop=false):Statement {
      let object = this.parsePrimaryExpr(inFunction,inLoop)
      while(this.at().type ===TokenType.Dot || this.at().type === TokenType.OpenBracket){
        const operator = this.eat()
        let property:Statement;
        let computed:boolean;
        if(operator.type==TokenType.Dot){
            computed =false
            property = this.parsePrimaryExpr(inFunction,inLoop)
            if(property.kind!=="Identifier") throw `Cannot use dot op without rhs being an identifier`
        }
        else{
            computed = true
            property = this.parseExpr(inFunction,inLoop)
            this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value")
        }
        object = {kind: "MemberExpr", object,property,computed} as MemberExpr

      }
      return object
    }
    private parsePrimaryExpr(inFunction=false,inLoop=false): Statement {
        const token = this.at()
        switch (token.type) {
            case TokenType.Break:
                this.eat()
                if(inLoop===false) throw `Not in loop`
                return{
                    kind: "BreakStatement",
                } as BreakStatement
            case TokenType.Continue:
                this.eat()
                if(inLoop===false) throw `Not in loop`
                return{
                    kind: "ContinueStatement",
                } as ContinueStatement
            case TokenType.Return:
                this.eat()
                if(inFunction===false) throw `Not in function`
                return{
                    kind: "ReturnStatement",
                    value: this.parseExpr()
                } as ReturnStatement
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
            case TokenType.Unassigned:
                return {
                    kind: "Unassigned",
                    value: this.eat().value
                } as Unassigned
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
                const value = this.parseExpr(inFunction)
                this.expect(TokenType.CloseParen, "Unclosed Parenthesis")
                return value
            }
            case TokenType.OpenBracket:{
                const props = []
                this.eat()
                while (this.at().type !== TokenType.EOF && this.at().type !== TokenType.CloseBracket) {
                    if(this.at().type==TokenType.Comma){
                        this.eat()
                        props.push(this.parseExpr(inFunction))
                        continue
                    }
                    props.push(this.parseExpr(inFunction))
                }
                this.expect(TokenType.CloseBracket, "Expected closing bracked")
                return {kind:"ArrayLiteral",value:props} as ArrayLiteral
            }
            default:
                console.log(token)
                throw `Token not recognized`
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