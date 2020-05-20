"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMultiStepInput = exports.debug = void 0;
const fs = require('fs');
const vscode_1 = require("vscode");
const MultiStepInput_1 = require("./MultiStepInput");
const { toTemplatesDirectoryPath, forceLoadTemplates, createFile, } = require('./tempula-core');
// なぜかcoreのdebugが動かない(呼び出せてないような)
const doDebug = false;
exports.debug = (...obj) => {
    if (doDebug)
        console.log(...obj);
};
const getFileSystemAbsolutePaths = (uri) => {
    const rootPath = vscode_1.workspace.rootPath || '';
    const outputDirectoryPath = uri.fsPath;
    const templatesDirectoryPath = toTemplatesDirectoryPath(rootPath);
    return {
        rootPath,
        outputDirectoryPath,
        templatesDirectoryPath,
    };
};
async function runMultiStepInput(context, uri) {
    async function collectInputs() {
        const state = {};
        await MultiStepInput_1.MultiStepInput.run((input) => pickTemplateFile(input, state));
        return state;
    }
    const { rootPath, outputDirectoryPath, templatesDirectoryPath, } = getFileSystemAbsolutePaths(uri);
    const templateFileNames = forceLoadTemplates(templatesDirectoryPath);
    exports.debug('root:', rootPath);
    exports.debug('tempula:', templatesDirectoryPath);
    exports.debug('templateFileNames:', templateFileNames);
    exports.debug('output:', outputDirectoryPath);
    const templateFilePickItems = templateFileNames.map((label) => ({ label }));
    const title = 'New File by tempula';
    async function pickTemplateFile(input, state) {
        const picked = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 2,
            placeholder: 'Pick a template',
            items: templateFilePickItems,
            activeItem: state.pickedTemplateFileItem,
            shouldResume: shouldResume,
        });
        state.pickedTemplateFileItem = picked;
        state.pickedTemplateFileName = picked.label;
        return (input) => inputNewFileName(input, state);
    }
    const toPathBelowRoot = (fullPath) => fullPath.replace(rootPath, '').replace(/^\//, '');
    const fileNamesToMessage = (outputFilePath, templateFileName) => `${toPathBelowRoot(outputFilePath)}<${templateFileName}>`;
    const toMessage = (fileNameText, status) => `tempula: ${status} - ${fileNameText}`;
    const handleCreateResult = (state, { outputFilePath, success, exception, error, }) => {
        const fileNameText = fileNamesToMessage(outputFilePath, state.pickedTemplateFileName || '');
        if (success)
            return vscode_1.window.showInformationMessage(toMessage(fileNameText, 'Created.'));
        if (exception)
            return vscode_1.window.showErrorMessage(toMessage(fileNameText, exception));
        if (error === null || error === void 0 ? void 0 : error.exists)
            return vscode_1.window.showErrorMessage(toMessage(fileNameText, 'Already exists.'));
    };
    async function inputNewFileName(input, state) {
        state.inputFileName = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 2,
            value: state.inputFileName || '',
            prompt: 'Input a unique file name without extension.',
            validate: validateNameIsUnique,
            shouldResume: shouldResume,
        });
        const result = createFile(rootPath, state.pickedTemplateFileName, outputDirectoryPath, state.inputFileName);
        handleCreateResult(state, result);
        return (input) => inputNewFileName(input, state);
    }
    function shouldResume() {
        return new Promise((resolve, reject) => { });
    }
    async function validateNameIsUnique(name) {
        return undefined;
    }
    await collectInputs();
}
exports.runMultiStepInput = runMultiStepInput;
//# sourceMappingURL=runMultiStepInput.js.map