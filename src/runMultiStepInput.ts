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
  debug,
  toTemplatesDirectoryPath,
  forceLoadTemplates,
  createFile,
} = require('./tempula-core');

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

  const rootPath = workspace.rootPath || '';
  const outputDirectoryPath = uri.fsPath;
  const templatesDirectoryPath: string = toTemplatesDirectoryPath(rootPath);
  const templateFileNames: string[] = forceLoadTemplates(
    templatesDirectoryPath
  );
  debug('root:', rootPath);
  debug('tempula:', templatesDirectoryPath);
  debug('templateFileNames:', templateFileNames);
  debug('output:', outputDirectoryPath);

  const toPathBelowRoot = (fullPath: string) =>
    fullPath.replace(rootPath, '').replace(/^\//, '');

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
    const outputFilePathRelative = toPathBelowRoot(outputFilePath);
    if (success) {
      window.showInformationMessage(
        `tempula: Created. ${outputFilePathRelative}<${state.pickedTemplateFileName}>`
      );
    } else if (exception) {
      window.showErrorMessage(
        `tempula: ${exception} - ${outputFilePathRelative}<${state.pickedTemplateFileName}>`
      );
    } else if (error?.exists) {
      window.showErrorMessage(
        `tempula: Already exists. - ${outputFilePathRelative}<${state.pickedTemplateFileName}>`
      );
    }
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
    handleCreateResult(
      state,
      createFile(
        rootPath,
        state.pickedTemplateFileName,
        outputDirectoryPath,
        state.inputFileName
      )
    );
    return (input: MultiStepInput) => inputNewFileName(input, state);
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise<boolean>((resolve, reject) => {});
  }

  async function validateNameIsUnique(name: string) {
    // ...validate...
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return name === 'vscode' ? 'Name not unique' : undefined;
  }

  await collectInputs();
}
