import * as vscode from 'vscode';

import { isCancel } from "axios"
import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage } from "openai";


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "gpt-editor" is now active!');
	const outputChannel = vscode.window.createOutputChannel('GPT-Editor');

	const fix = vscode.commands.registerCommand('gpt-editor.fix', async () => {
		const prompt = await getPromptFromSelection('What to fix', ['Spelling', 'Grammar', 'Spelling and Grammar'])
		if (!prompt) {
			vscode.window.showErrorMessage("Unknown prompt");
			return;
		}
		await replaceTextWithGeneratedText(prompt);
	});

	const summary = vscode.commands.registerCommand('gpt-editor.summary', async () => {
		const prompt = await getPromptFromSelection('Length of summary', ['Sentence', 'Paragraph'])
		const input_text = getText();
		const summary = await callOpenAIAPI(input_text, prompt);
		outputChannel.appendLine(`Suggested summary: ${summary}`);
		outputChannel.show();
	});

	const tone = vscode.commands.registerCommand('gpt-editor.tone', async () => {
		const prompt = await getPromptFromSelection('Tone to use', ['Casual', 'Friendly', 'Professional'])
		if (!prompt) {
			vscode.window.showErrorMessage("Unknown prompt");
			return;
		}
		await replaceTextWithGeneratedText(prompt);
	});

	const opinionatedEdit = vscode.commands.registerCommand('gpt-editor.opinionated-edit', async () => {
		let prompt = prompts.get('Opinionated')??'';
		await replaceTextWithGeneratedText(prompt);
	});

	const customPrompt = vscode.commands.registerCommand('gpt-editor.custom-prompt', async () => {
		let prompt = await vscode.window.showInputBox({
			prompt: 'Enter a custom prompt to apply to the selected text',
			value: ''
		});
		if (!prompt) {
			vscode.window.showErrorMessage("Need a valid prompt");
			return '';
		}
		await replaceTextWithGeneratedText(prompt);
	});

	context.subscriptions.push(fix, summary, tone, opinionatedEdit, customPrompt);
}

const prompts = new Map<string, string>([
	['Opinionated', `Please fix any mistakes in spelling and grammar in this text. 
Shorten the text slightly, remove unnecessary adverbs and make it sound more intelligent. 
Preserve formatting, including any markdown. Ignore any code. Make no other changes. 
Don't add any additional text before or after.`],
	['Spelling', `Please fix any mistakes in spelling in this text. 
Ignore any code. Make no other changes. Don't add any additional text before or after.`],
	['Grammar', `Please fix any mistakes in grammar in this text. 
Ignore any code. Make no other changes. Don't add any additional text before or after.`],
	['Spelling and Grammar', `Please fix any mistakes in spelling and grammar in this text. 
Ignore any code. Make no other changes. Don't add any additional text before or after.`],
	['Paragraph', `Please write a one paragraph summary of this text. Don't add any additional text before or after.`],
	['Sentence', `Please write a one sentence blurb of this text. Don't add any additional text before or after.`],
	['Casual', `Please change the tone of this text to casual`],
	['Friendly', `Please change the tone of this text to friendly`],
	['Professional', `Please change the tone of this text to professional`],
])

async function getPromptFromSelection(placeHolder: string, options: Array<string>): Promise<string> {
	const selectedOption = await vscode.window.showQuickPick(options, {
		placeHolder: placeHolder,
	});
	if (!selectedOption) {
		return '';
	}
	return prompts.get(selectedOption) ?? '';
}

async function replaceTextWithGeneratedText(prompt: string) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor");
		return '';
	}
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showErrorMessage("No text selected");
		return '';
	}
	const input_text = editor.document.getText(selection);
	const replaced_text = await callOpenAIAPI(input_text, prompt);
	editor.edit((editBuilder) => {
		editBuilder.replace(selection, replaced_text);
	})
}

function getText(): string {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		vscode.window.showErrorMessage("No active editor");
		return '';
	}

	const selection = editor.selection;
	if (!selection.isEmpty) {
		return editor.document.getText(selection);
	}

	const entireRange = new vscode.Range(
		0,
		0,
		editor.document.lineCount - 1,
		editor.document.lineAt(editor.document.lineCount - 1).text.length
	);
	return editor.document.getText(entireRange);
}

async function callOpenAIAPI(input_text: string, prompt: string) {
	const settings = vscode.workspace.getConfiguration()
	const api_key = settings.get('gpt-editor.openai_api_key')
	if (!api_key) {
		vscode.window.showErrorMessage('Please set the OpenAI API Key');
		return;
	}
	const configuration = new Configuration({
		apiKey: settings.get('gpt-editor.openai_api_key'),
	});
	const openai = new OpenAIApi(configuration);
	const messages: Array<ChatCompletionRequestMessage> = [
		{ "role": "system", "content": "You are a helpful assistant." },
		{ "role": "user", "content": `Consider this text:\n${input_text}` },
		{ "role": "user", "content": prompt },
	];
	const request: CreateChatCompletionRequest = {
		model: settings.get('gpt-editor.model', 'gpt-3.5-turbo'),
		n: 1,
		temperature: settings.get('gpt-editor.temperature', 0.5),
		top_p: settings.get('gpt-editor.top_p', 0.5),
		messages: messages
	}
	return await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification, // Show in notification area
		title: 'Querying OpenAI...', // Title of progress indicator
		cancellable: true // Allow user to cancel
	}, async (_, token) => {
		const controller = new AbortController();
		token.onCancellationRequested(() => {
			controller.abort();
		})
		let resp: any;
		try {
			resp = await openai.createChatCompletion(request, {
				signal: controller.signal,
			});
		} catch (error) {
			if (isCancel(error)) {
				console.log("Query to OpenAI cancelled");
				return '';
			}
			throw error;
		}
		const { choices } = resp.data;
		const [first_choice] = choices;
		const result = first_choice.message?.content;
		return result;
	})
}

// This method is called when your extension is deactivated
export function deactivate() { }
