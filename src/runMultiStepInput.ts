const fs = require('fs');

import {
  QuickPickItem,
  window,
  ExtensionContext,
  workspace,
  Uri,
} from 'vscode';

import { MultiStepInput } from './MultiStepInput';

const {
  toTemplatesDirectoryPath,
  forceLoadTemplates,
  createFile,
} = require('./tempula-core');

// なぜかcoreのdebugが動かない(呼び出せてないような)
const doDebug = false;
export const debug = (...obj: any[]) => {
  if (doDebug) console.log(...obj);
};

const getFileSystemAbsolutePaths = (uri: Uri) => {
  const rootPath = workspace.rootPath || '';
  const outputDirectoryPath = uri.fsPath;
  const templatesDirectoryPath: string = toTemplatesDirectoryPath(rootPath);

  return {
    rootPath,
    outputDirectoryPath,
    templatesDirectoryPath,
  };
};

export async function runMultiStepInput(context: ExtensionContext, uri: Uri) {
  interface State {
    title: string;
    step: number;
    totalSteps: number;
    pickedTemplateFileItem: QuickPickItem;
    pickedTemplateFileName: string;
    inputFileName: string;
  }

  async function collectInputs() {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => pickTemplateFile(input, state));
    return state as State;
  }

  const {
    rootPath,
    outputDirectoryPath,
    templatesDirectoryPath,
  } = getFileSystemAbsolutePaths(uri);
  const templateFileNames: string[] = forceLoadTemplates(
    templatesDirectoryPath
  );
  debug('root:', rootPath);
  debug('tempula:', templatesDirectoryPath);
  debug('templateFileNames:', templateFileNames);
  debug('output:', outputDirectoryPath);

  const templateFilePickItems: QuickPickItem[] = templateFileNames.map(
    (label) => ({ label })
  );

  const title = 'New File by tempula';

  async function pickTemplateFile(
    input: MultiStepInput,
    state: Partial<State>
  ) {
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
    return (input: MultiStepInput) => inputNewFileName(input, state);
  }

  const toPathBelowRoot = (fullPath: string) =>
    fullPath.replace(rootPath, '').replace(/^\//, '');
  const fileNamesToMessage = (
    outputFilePath: string,
    templateFileName: string
  ) => `${toPathBelowRoot(outputFilePath)}<${templateFileName}>`;
  const toMessage = (fileNameText: string, status: string) =>
    `tempula: ${status} - ${fileNameText}`;
  const handleCreateResult = (
    state: Partial<State>,
    {
      outputFilePath,
      success,
      exception,
      error,
    }: {
      outputFilePath: string;
      success: boolean;
      exception?: string;
      error?: { exists: boolean };
    }
  ) => {
    const fileNameText = fileNamesToMessage(
      outputFilePath,
      state.pickedTemplateFileName || ''
    );
    if (success)
      return window.showInformationMessage(toMessage(fileNameText, 'Created.'));
    if (exception)
      return window.showErrorMessage(toMessage(fileNameText, exception));
    if (error?.exists)
      return window.showErrorMessage(
        toMessage(fileNameText, 'Already exists.')
      );
  };

  async function inputNewFileName(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.inputFileName = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 2,
      value: state.inputFileName || '',
      prompt: 'Input a unique file name without extension.',
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
    });
    const result = createFile(
      rootPath,
      state.pickedTemplateFileName,
      outputDirectoryPath,
      state.inputFileName
    );
    handleCreateResult(state, result);
    return (input: MultiStepInput) => inputNewFileName(input, state);
  }

  function shouldResume() {
    return new Promise<boolean>((resolve, reject) => {});
  }

  async function validateNameIsUnique(name: string) {
    return undefined;
  }

  await collectInputs();
}
