export type ValueType = "null" | "boolean" | "string" | "int" | "float" | "any"
export interface RuntimeVal {
    type: ValueType
}
export interface NullVal extends RuntimeVal {
    type: "null",
    value: null
}

export interface BoolVal extends RuntimeVal {
    type: "boolean"
    value: boolean
}
export interface StringVal extends RuntimeVal {
    type: "string"
    value: string
}
export interface IntVal extends RuntimeVal {
    type: "int"
    value: number
}
export interface FloatVal extends RuntimeVal {
    type: "float"
    value: number
}
export interface AnyVal extends RuntimeVal {
    type: "any"
    value: any
}


