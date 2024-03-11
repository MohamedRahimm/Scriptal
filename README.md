A programming language created in Typescript

#Dependency [Deno](https://deno.com/) is needed to use this repo

#Building To build the content of this repository, run `npm i`

```rs
git clone https://github.com/MohamedRahimm/custom-ts-interpreter.git
npm install
```

#Running

- To run a specific file: `deno task start <DIR/FILENAME>`
- To run in REPL mode `deno task start`

#Examples You can find examples in /showcase/main.txt

##Variables Mutable variables are created with:

```rs
let x = 0;
```

Constant variables are created with:

```rs
const x = 0;
```

**Note** Semicolons are required at the end of every declaration or expression

##Primitive Data Types ###Strings Strings can be created with:

```rs
let x = "lorem ipsum";
```

###Numbers Numbers can be created with:

```rs
let x = 100;
```

or

```rs
let x =1.01;
```

###Booleans Booleans can be created with:

```rs
let x = true;
let y = false
```

###Null Null variables can be assigned with:

```rs
let x = null;
```

###Unassigned Unassigned variables can be implicity created with:

```rs
let x;
```

or explicity created by

```rs
let x = unassigned;
```

##Data Structures ###Objects Objects are similar to javascript's native objects:

```rs
const x = {lorem:"ipsum"};
print(x.lorem);
```

###Arrays Arrays are similar to javascript's native arrays: ####Array methods
are currently unsupported

```rs
let x = [1,2,true,unassigned];
```

##Comments Comments are created using the ``` character

```rs
`Lorem Ipsum`
```

##Functions Functions return the last computed value or of null. You can create
functions with:

```rs
function x(param1,param2){
    return param1 == param2
};
```

##If Statements ####Else if keyword is currently unsupported use nested else if
statements instead If statements are created with:

```rs
if(1==1){
    print("1 is in fact equal to 1")
}
else{
    "this isn't right 🧐"
}
```

**Note** if statements without block statements({}) are invalid ##Loops ###For
Loops For loops can be created with:

```rs
for(let i =0;i<3;i+=1){
    if(i==0){
        break;
    }
    print(i);
};
```

**Note** for(;;) is invalid ###While Loops While loops can be created with:

```rs
let i = 0;
while(i<3){
    if(i==0){
        continue;
    };
    i+=1;
};
```

##Operators Unique Operators:

- `^` exponent
- `//` divides and floors the result
