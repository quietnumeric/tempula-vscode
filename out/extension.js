"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const runMultiStepInput_1 = require("./runMultiStepInput");
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('tempula.new', async (uri) => {
        runMultiStepInput_1.runMultiStepInput(context, uri);
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map