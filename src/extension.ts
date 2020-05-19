import { commands, ExtensionContext } from 'vscode';
import { multiStepInput } from './multiStepInput';

export function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand('tempula.new', async () => {
		multiStepInput(context);
	}));
}
