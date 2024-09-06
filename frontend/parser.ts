import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  Boolean,
  CallExpr,
  ForStmt,
  FunctionDeclaration,
  Identifier,
  IfStmt,
  MemberExpr,
  Null,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Property,
  ReturnStmt,
  Stmt,
  StringLiteral,
  TermStmt,
  UnaryExpr,
  Unassigned,
  VarDeclaration,
  WhileStmt,
} from "./ast.ts";
import { tokenize } from "./lexer.ts";
import { Token, TokenType } from "./tokenDefinitions.ts";

/*
Recursive descent parser
Order of Prescedence(Ascending Order):
Variable/Function Declarations | If Statements | While/For Loops | Assignment Expressions,
Logical Operators,
Relational Operators,
Equality Operators,
Object Expressions,
Additive Operators,
Multiplicative Operators,
Exponent Operators,
Unary Operators,
Call Expressions | Member Expressions,
Primary Expressions
*/

export class Parser {
  private tokens: Token[] = [];
  idx!: number;
  private at() {
    return this.tokens[this.idx] as Token;
  }
  private eat() {
    return this.tokens[this.idx++] as Token;
  }
  private expect(expectedType: TokenType, errorMsg: string) {
    const prev = this.tokens[this.idx++];
    if (prev.type !== expectedType) {
      throw `${errorMsg} in line ${prev.line}`;
    }
    return prev as Token;
  }
  private parseStatement(inFunction = false, inLoop = false): Stmt {
    switch (this.at().type) {
      case TokenType.Const:
      case TokenType.Let:
        return this.parseVarDec(inFunction, inLoop);
      case TokenType.Function:
        return this.parseFunctionDec(inFunction, inLoop);
      case TokenType.If:
        return this.parseIfStmt(inFunction, inLoop);
      case TokenType.For:
        return this.parseForStmt(inFunction, inLoop);
      case TokenType.While:
        return this.parseWhileStmt(inFunction, inLoop);
      default:
        return this.parseAssignmentExpr(inFunction, inLoop);
    }
  }
  private parseVarDec(inFunction = false, inLoop = false): Stmt {
    const isConstant = this.eat().type == TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following let | const keywords",
    ).value;
    // let x;
    if (this.at().type == TokenType.Semicolon) {
      if (isConstant) {
        throw "Must assign value to constant expression";
      }
      return {
        kind: "VarDeclaration",
        identifier,
        constant: false,
      } as VarDeclaration;
    }
    // let x = foo
    this.expect(
      TokenType.Equals,
      "Expected equals token following identifier in var declaration",
    );
    const declaration = {
      kind: "VarDeclaration",
      value: this.parseAssignmentExpr(inFunction, inLoop),
      identifier,
      constant: isConstant,
    } as VarDeclaration;
    return declaration;
  }
  private parseFunctionDec(inFunction = false, inLoop = false): Stmt {
    //allows functions in objects
    if (this.at().type !== TokenType.Function) {
      return this.parseAssignmentExpr(inFunction, inLoop);
    }
    this.eat();
    const name = this.expect(
      TokenType.Identifier,
      "Expected Function name after Function keyword",
    ).value;
    const args = this.parseArgs();
    const params: string[] = [];
    for (const arg of args) {
      if (arg.kind !== "Identifier") {
        throw `Inside function declaration expected parameters to be of type string instead got ${arg}`;
      }
      params.push((arg as Identifier).symbol);
    }
    const body = this.parseBlockStatement(true, inLoop);
    const fn = {
      body,
      name,
      parameters: params,
      kind: "FunctionDeclaration",
    } as FunctionDeclaration;
    return fn;
  }
  private parseIfStmt(inFunction = false, inLoop = false): Stmt {
    this.eat();
    this.expect(TokenType.OpenParen, "Expected ( after keyword if");
    const condition = this.parseAssignmentExpr(inFunction, inLoop);
    this.expect(TokenType.CloseParen, "Expected )");
    const body = this.parseBlockStatement(inFunction, inLoop);
    if (this.tokens[this.idx + 1]?.type === TokenType.Else) {
      this.expect(TokenType.Semicolon, "Expected ;");
    }
    let elseExpr: Stmt[] = [];
    //Nested If Else Statements
    if (this.at().type == TokenType.Else) {
      this.eat();
      if (this.at().type == TokenType.If) {
        elseExpr = [this.parseIfStmt(inFunction, inLoop)];
      } else elseExpr = this.parseBlockStatement(inFunction, inLoop);
    }
    return {
      kind: "IfStmt",
      body,
      condition,
      elseExpr,
    } as IfStmt;
  }
  private parseForStmt(inFunction = false, inLoop = false): Stmt {
    // Cannot do for(;;)
    this.eat();
    this.expect(TokenType.OpenParen, "Expected (");
    const initVar = this.parseVarDec(inFunction);
    this.expect(TokenType.Semicolon, "Expected ;");
    const condition = this.parseAssignmentExpr(inFunction);
    this.expect(TokenType.Semicolon, "Expected ;");
    const iteration = this.parseAssignmentExpr(inFunction);
    this.expect(TokenType.CloseParen, "Expected )");
    const body = this.parseBlockStatement(inFunction, true);
    return {
      kind: "ForStmt",
      initVar,
      condition,
      iteration,
      body,
    } as ForStmt;
  }
  private parseWhileStmt(inFunction = false, inLoop = false): Stmt {
    this.eat();
    this.expect(TokenType.OpenParen, "Expected (");
    const condition = this.parseAssignmentExpr(inFunction);
    this.expect(TokenType.CloseParen, "Expected )");
    const body = this.parseBlockStatement(inFunction, true);
    return {
      kind: "WhileStmt",
      body,
      condition,
    } as WhileStmt;
  }
  private parseBlockStatement(inFunction = false, inLoop = false): Stmt[] {
    this.expect(
      TokenType.OpenBrace,
      `{ expected`,
    );
    const body: Stmt[] = [];
    while (
      this.at().type !== TokenType.EOF &&
      this.at().type !== TokenType.CloseBrace
    ) {
      body.push(this.parseStatement(inFunction, inLoop));
      this.expect(
        TokenType.Semicolon,
        `; expected`,
      );
    }
    this.expect(
      TokenType.CloseBrace,
      `} expected`,
    );
    return body;
  }
  private parseAssignmentExpr(inFunction = false, inLoop = false): Stmt {
    const left = this.parseLogicalExpr(inFunction, inLoop);
    if (this.at().type == TokenType.Equals) {
      this.eat();
      const value = this.parseAssignmentExpr(inFunction, inLoop);
      return {
        value,
        assignee: left,
        kind: "AssignmentExpr",
      } as AssignmentExpr;
    }
    return left;
  }
  private parseLogicalExpr(inFunction = false, inLoop = false): Stmt {
    let left = this.parseRelationalExpr(inFunction, inLoop);
    while (this.at().value === "||" || this.at().value === "&&") {
      const operator = this.eat().value;
      const right = this.parseRelationalExpr(inFunction, inLoop);
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseRelationalExpr(inFunction = false, inLoop = false): Stmt {
    const left = this.parseEqualityExpr(inFunction, inLoop);
    const RelationalOps = new Set<string>(["<", ">", "<=", ">="]);
    if (RelationalOps.has(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parseEqualityExpr(inFunction, inLoop);
      return {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseEqualityExpr(inFunction = false, inLoop = false): Stmt {
    const left = this.parseObjectExpr(inFunction, inLoop);
    if (this.at().value === "==" || this.at().value == "!=") {
      const operator = this.eat().value;
      const right = this.parseObjectExpr(inFunction, inLoop);
      return {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseObjectExpr(inFunction = false, inLoop = false): Stmt {
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parseAdditiveExpr(inFunction, inLoop);
    }
    this.eat();
    const properties = new Array<Property>();
    while (
      this.at().type !== TokenType.EOF &&
      this.at().type !== TokenType.CloseBrace
    ) {
      // const key = this.expect(TokenType.Identifier, "Invalid key for object").value;
      let key;
      if (this.at().type === TokenType.Identifier) {
        key = this.expect(TokenType.Identifier, "Invalid key for object").value;
      } else if (this.at().type === TokenType.QuotationMark) {
        key = (this.parseStrOrArrLiteral() as StringLiteral).value;
      } else "Invalid key for object";
      // allows {key,...}
      if (this.at().type == TokenType.Comma) {
        this.eat();
        properties.push({ key, kind: "Property" } as Property);
        continue;
      } //allows {key}
      else if (this.at().type === TokenType.CloseBrace) {
        properties.push({ key, kind: "Property" } as Property);
        continue;
      }
      this.expect(TokenType.Colon, "Expected :");
      const value = this.parseFunctionDec(inFunction, inLoop);
      properties.push({ kind: "Property", value, key } as Property);
      if (this.at().type !== TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          "Expected , or } following property",
        );
      }
    }

    this.expect(TokenType.CloseBrace, "Expected }");
    return { kind: "ObjectLiteral", properties } as ObjectLiteral;
  }
  private parseAdditiveExpr(inFunction = false, inLoop = false): Stmt {
    let left = this.parseMultiplicativeExpr(inFunction, inLoop);
    while (this.at().value === "+" || this.at().value === "-") {
      const operator = this.eat().value;
      const right = this.parseMultiplicativeExpr(inFunction, inLoop);
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseMultiplicativeExpr(
    inFunction = false,
    inLoop = false,
  ): Stmt {
    let left = this.parseExponentExpr(inFunction, inLoop);
    while (
      this.at().value === "/" || this.at().value === "*" ||
      this.at().value === "%" || this.at().value === "//"
    ) {
      const operator = this.eat().value;
      const right = this.parseExponentExpr(inFunction, inLoop);
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseExponentExpr(inFunction = false, inLoop = false): Stmt {
    let left = this.parseUnaryExpr(inFunction, inLoop);
    while (this.at().value === "^") {
      const operator = this.eat().value;
      const right = this.parseUnaryExpr(inFunction, inLoop);
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }
  private parseUnaryExpr(inFunction = false, inLoop = false): Stmt {
    if (this.at().value === "+" || this.at().value === "-") {
      const op = this.eat().value;
      const right = this.parsePrimaryExpr(inFunction, inLoop);
      return { kind: "UnaryExpr", operator: op, right } as UnaryExpr;
    }
    return this.parseCallMemberExpr(inFunction, inLoop);
  }
  private parseCallMemberExpr(inFunction = false, inLoop = false): Stmt {
    const member = this.parseMemberExpr(inFunction, inLoop);
    if (this.at().type == TokenType.OpenParen) {
      return this.parseCallExpr(member);
    }
    return member;
  }
  private parseCallExpr(caller: Stmt): Stmt {
    let callExpr: Stmt = {
      kind: "CallExpr",
      caller,
      args: this.parseArgs(),
    } as CallExpr;
    if (this.at().type == TokenType.OpenParen) {
      callExpr = this.parseCallExpr(callExpr);
    }
    return callExpr;
  }
  private parseArgs(): Stmt[] {
    this.expect(TokenType.OpenParen, "Expected open parenthesis");
    const args = this.at().type == TokenType.CloseParen
      ? []
      : this.parseArgsList();
    this.expect(
      TokenType.CloseParen,
      "Missing ) inside argument list",
    );
    return args;
  }
  private parseArgsList(): Stmt[] {
    const args = [this.parseAssignmentExpr()];
    while (
      this.at().type !== TokenType.EOF && this.at().type === TokenType.Comma
    ) {
      this.eat();
      args.push(this.parseAssignmentExpr());
    }
    return args;
  }
  private parseMemberExpr(inFunction = false, inLoop = false): Stmt {
    let object = this.parseStrOrArrLiteral(inFunction, inLoop);
    while (
      this.at().type === TokenType.Dot ||
      this.at().type === TokenType.OpenBracket
    ) {
      const operator = this.eat();
      let property: Stmt;
      let computed: boolean;
      if (operator.type == TokenType.Dot) {
        computed = false;
        property = this.parsePrimaryExpr(inFunction, inLoop);
        if (property.kind !== "Identifier") {
          throw `Cannot use dot op without right side being an identifier`;
        }
      } else {
        computed = true;
        property = this.parseAssignmentExpr(inFunction, inLoop);
        this.expect(
          TokenType.CloseBracket,
          "Missing ] in computed value",
        );
      }
      object = { kind: "MemberExpr", object, property, computed } as MemberExpr;
    }
    return object;
  }
  private parseStrOrArrLiteral(inFunction = false, inLoop = false): Stmt {
    if (this.at().type === TokenType.QuotationMark) {
      let value = "";
      this.eat();
      while (
        this.at().type !== TokenType.EOF &&
        this.at().type !== TokenType.QuotationMark
      ) {
        value += this.eat().value;
      }
      this.expect(TokenType.QuotationMark, "Unclosed Quote");
      return { kind: "StringLiteral", value } as StringLiteral;
    } else if (this.at().type === TokenType.OpenBracket) {
      const props = [];
      this.eat();
      while (
        this.at().type !== TokenType.EOF &&
        this.at().type !== TokenType.CloseBracket
      ) {
        if (this.at().type == TokenType.Comma) {
          this.eat();
          props.push(this.parseAssignmentExpr(inFunction, inLoop));
          continue;
        }
        props.push(this.parseAssignmentExpr(inFunction, inLoop));
      }
      this.expect(TokenType.CloseBracket, "Expected closing bracket");
      return { kind: "ArrayLiteral", elements: props } as ArrayLiteral;
    }
    return this.parsePrimaryExpr(inFunction, inLoop);
  }
  private parsePrimaryExpr(inFunction = false, inLoop = false): Stmt {
    const token = this.at();
    switch (token.type) {
      case TokenType.Break:
      case TokenType.Continue:
        if (inLoop === false) {
          throw `${token.value} statement is unallowed outside of loops`;
        }
        return {
          kind: this.eat().type === TokenType.Continue
            ? "ContStmt"
            : "BreakStmt",
        } as TermStmt;
      case TokenType.Return:
        this.eat();
        if (inFunction === false) {
          throw `${token.value} statement is unallowed outside of functions`;
        }
        return {
          kind: "ReturnStmt",
          value: this.parseAssignmentExpr(),
        } as ReturnStmt;
      case TokenType.Identifier:
        return {
          kind: "Identifier",
          symbol: this.eat().value,
        } as Identifier;
      case TokenType.Number:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.eat().value),
        } as NumericLiteral;
      case TokenType.Null:
        this.eat();
        return {
          kind: "Null",
          value: null,
        } as Null;
      case TokenType.Boolean:
        return {
          kind: "Boolean",
          value: this.eat().value === "true",
        } as Boolean;
      case TokenType.Unassigned:
        return {
          kind: "Unassigned",
          value: this.eat().value,
        } as Unassigned;

      case TokenType.OpenParen: {
        this.eat();
        const value = this.parseAssignmentExpr(inFunction);
        this.expect(TokenType.CloseParen, "Unclosed Parenthesis");
        return value;
      }

      default:
        throw `Unexpected token ${JSON.stringify(token.value)}`;
    }
  }
  produceAst(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    this.idx = 0;
    const program: Program = {
      kind: "Program",
      body: [],
    };
    while (this.at().type !== TokenType.EOF) {
      program.body.push(this.parseStatement());
      this.expect(TokenType.Semicolon, "Missing ;");
    }
    return program;
  }
}
