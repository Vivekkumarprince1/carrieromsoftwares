let canvasLib = null;
let runtimeName = null;

function loadCanvasLib() {
    if (canvasLib) {
        return canvasLib;
    }

    try {
        canvasLib = require("@napi-rs/canvas");
        runtimeName = "@napi-rs/canvas";
        console.log(`Canvas runtime loaded: ${runtimeName}`);
        return canvasLib;
    } catch (napiError) {
        console.warn("@napi-rs/canvas unavailable, trying node-canvas fallback");
        try {
            canvasLib = require("canvas");
            runtimeName = "canvas";
            console.log(`Canvas runtime loaded: ${runtimeName}`);
            return canvasLib;
        } catch (canvasError) {
            console.error("No supported canvas runtime could be loaded", {
                napiError: napiError.message,
                canvasError: canvasError.message,
            });
            throw new Error("Canvas runtime unavailable. Install @napi-rs/canvas or canvas.");
        }
    }
}

function createCanvas(width, height) {
    return loadCanvasLib().createCanvas(width, height);
}

async function loadImage(src) {
    return loadCanvasLib().loadImage(src);
}

function registerFont(fontPath, options) {
    const lib = loadCanvasLib();

    if (typeof lib.registerFont === "function") {
        return lib.registerFont(fontPath, options);
    }

    if (lib.GlobalFonts && typeof lib.GlobalFonts.registerFromPath === "function") {
        const result = lib.GlobalFonts.registerFromPath(fontPath, options.family);
        if (!result) {
            throw new Error(`Failed to register font at ${fontPath}`);
        }
        return result;
    }

    throw new Error("Font registration is not supported by the active canvas runtime");
}

function getCanvasRuntime() {
    loadCanvasLib();
    return runtimeName;
}

module.exports = {
    createCanvas,
    loadImage,
    registerFont,
    getCanvasRuntime,
};
