// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import axios from 'axios';
import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "gpt-editor" is now active!');

	const ping = vscode.commands.registerCommand('gpt-editor.ping', async () => {
		const response = await axios.get("https://nindalf.com/kudos?url=https://nindalf.com/");
		const { kudo_count } = response.data;

		vscode.window.showInformationMessage(`Current kudo count is ${kudo_count}`);
	});

	const commandPrompts = [
		['gpt-editor.shortBlurb', `Please write a one sentence blurb of this text. Don't add any additional text before or after.`],
		['gpt-editor.summary', `Please write a one paragraph summary of this text. Don't add any additional text before or after.`],
	]

	for (const [command, prompt] of commandPrompts) {
		const item = vscode.commands.registerCommand(command, async () => {
			const input_text = getText();
			console.log(input_text);
			const summary = await callOpenAIAPI(input_text, prompt);
			vscode.window.showInformationMessage(`Suggested summary:${summary}`);
		});
		context.subscriptions.push(item);
	}
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
		max_tokens: 60,
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
			if (axios.isCancel(error)) {
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
