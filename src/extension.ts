import { commands, ExtensionContext, Uri } from 'vscode';
import { runMultiStepInput } from './runMultiStepInput';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('tempula.new', async (uri: Uri) => {
      runMultiStepInput(context, uri);
    })
  );
}
