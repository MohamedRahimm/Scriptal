// deno-lint-ignore-file no-explicit-any
import { newConsole } from "./newConsole.ts";

function replacer(_key: string, value: any) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()) || value,
    };
  }
  return value;
}
// DOES NOT SUPPORT CIRCULAR OBJS

function parseMapObject(prop: any, parentStr: string) {
  let output = "";
  const maptoStr = JSON.stringify(
    prop,
    replacer,
  );
  const methodsIdx = parentStr.search(/"methods":/) + `"methods":`.length;
  const propsIdx = parentStr.search(/"properties":/) + `"properties":`.length;
  if (methodsIdx !== 9) {
    output = `${parentStr.substring(0, methodsIdx)}${maptoStr}${
      parentStr.substring(methodsIdx + "{}".length)
    } \n`;
  } else if (propsIdx !== 12) {
    output = `${parentStr.substring(0, propsIdx)}${maptoStr}${
      parentStr.substring(propsIdx + "{}".length)
    } \n`;
  }
  return output;
}

export function readConsole() {
  const output = [];
  for (const obj of newConsole.history) {
    const originalStr = JSON.stringify(obj);
    let propStr = "";
    for (const prop in obj) {
      if (obj[prop] instanceof Map) {
        propStr += parseMapObject(obj[prop], originalStr);
      }
    }
    if (propStr.length === 0) propStr = originalStr;
    output.push(propStr);
  }
  newConsole.clearHistory();
  return output;
}
