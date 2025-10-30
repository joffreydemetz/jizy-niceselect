/*! NiceSelect v@VERSION | MIT | @DATE | [@BUNDLE] */
(function (global) {
    "use strict";

    if (typeof global !== "object" || !global || !global.document) {
        throw new Error("NiceSelect requires a window with a document");
    }

    if (typeof global.NiceSelect !== "undefined") {
        throw new Error("NiceSelect is already defined");
    }

    // @CODE 

    global.NiceSelect = NiceSelect;
})(typeof window !== "undefined" ? window : this);