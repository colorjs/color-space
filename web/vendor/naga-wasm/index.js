import * as wasm from "./wasm/naga.js";
export { default as init } from "./wasm/naga.js";
export { nagaVersion } from "./version.js";
export class NagaError extends Error {
    name = "NagaError";
    kind;
    formatted;
    constructor(kind, formatted) {
        super(formatted.split("\n", 1)[0]?.replace(/^error: /, ""));
        this.kind = kind;
        this.formatted = formatted;
    }
}
function wrap(kind, fn) {
    return (...args) => {
        try {
            return fn(...args);
        }
        catch (error) {
            // wasm-bindgen reports use-after-free with a plain Error too
            if (!(error instanceof Error) ||
                error instanceof WebAssembly.RuntimeError ||
                error.message === "null pointer passed to rust") {
                throw error;
            }
            throw new NagaError(kind, error.message);
        }
    };
}
export const parseWgsl = wrap("parse", wasm.parseWgsl);
export const parseGlsl = wrap("parse", wasm.parseGlsl);
const parseSpirvBytes = wrap("parse", wasm.parseSpirv);
export const validate = wrap("validation", wasm.validate);
export const writeWgsl = wrap("write", wasm.writeWgsl);
const writeGlslOutput = wrap("write", wasm.writeGlsl);
const writeHlslOutput = wrap("write", wasm.writeHlsl);
const writeMslOutput = wrap("write", wasm.writeMsl);
export const writeSpirv = wrap("write", wasm.writeSpirv);
export function writeGlsl(module, info, options) {
    return writeGlslOutput(module, info, options);
}
export function writeHlsl(module, info, options) {
    return writeHlslOutput(module, info, options);
}
export function writeMsl(module, info, options) {
    return writeMslOutput(module, info, options);
}
export function parseSpirv(words) {
    return parseSpirvBytes(words instanceof Uint32Array
        ? new Uint8Array(words.buffer, words.byteOffset, words.byteLength)
        : words);
}
function parse(input) {
    switch (input.from) {
        case "wgsl": {
            return parseWgsl(input.source);
        }
        case "glsl": {
            return parseGlsl(input.source, input.parse);
        }
        case "spirv": {
            return parseSpirv(input.source);
        }
    }
}
function write(module, info, output) {
    switch (output.to) {
        case "wgsl": {
            return writeWgsl(module, info, output.options);
        }
        case "glsl": {
            return writeGlsl(module, info, { ...output.options, reflect: false });
        }
        case "hlsl": {
            return writeHlsl(module, info, { ...output.options, reflect: false });
        }
        case "msl": {
            return writeMsl(module, info, { ...output.options, reflect: false });
        }
        case "spirv": {
            return writeSpirv(module, info, output.options);
        }
    }
}
export function translate(input) {
    const module = parse(input);
    try {
        const info = validate(module);
        try {
            return write(module, info, input);
        }
        finally {
            info.free();
        }
    }
    finally {
        module.free();
    }
}
//# sourceMappingURL=index.js.map