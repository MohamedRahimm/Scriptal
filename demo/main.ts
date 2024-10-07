import { Parser } from "../frontend/parser.ts";
import { globalEnv } from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";
import { readConsole } from "./parseConsole.ts";
import { prettyPrintJson } from "pretty-print-json";
import * as monaco from "https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/+esm";
const options = {
    readOnly: false,
    minimap: { enabled: false },
    language: "javascript",
    automaticLayout: true,
    theme: "vs-dark",
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: {
        vertical: "hidden",
    },
    overviewRulerBorder: false,
    scrollBeyondLastLine: false,
    fontSize: 20,
    value: `function isPalindrome(num){
        let r = len(num)-1;
        let l = 0;
        while(l<r){
            if(num[l]!=num[r]){
                return false;
            };
            l+=1;
            r-=1;
        };
        return true;
    };
    print("ISPALINDROME", isPalindrome("12"));`,
};
const editor = monaco.editor.create(document.querySelector(".monaco"), options);

const button = document.querySelector("button")!;
const output = document.querySelector("output")!;

button.addEventListener("click", (e) => {
    e.preventDefault();
    output.innerHTML = "";
    const input = editor.getValue();
    if (input) {
        const parser = new Parser();
        const env = globalEnv();
        const program = parser.produceAst(input);
        evaluate(program, env);
        const consoleHistory = readConsole();
        for (const jsonObj of consoleHistory) {
            const html = prettyPrintJson.toHtml(JSON.parse(jsonObj));
            output.innerHTML += "\n" + html;
        }
    }
});
const errorHandler = (e: ErrorEvent) => {
    output.innerText = e.message.substring("Uncaught".length);
};
globalThis.addEventListener("error", errorHandler, true);
