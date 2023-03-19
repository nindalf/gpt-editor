// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import axios from 'axios';
import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage } from "openai";

const configuration = new Configuration({
	apiKey: 'todo',
  });
  

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-gpt" is now active!');

	let ping = vscode.commands.registerCommand('markdown-gpt.ping', async () => {
		let response = await axios.get("https://nindalf.com/kudos?url=https://nindalf.com/");
		const {kudo_count} = response.data;
		
		vscode.window.showInformationMessage(`Current kudo count is ${kudo_count}`);
	});
	
	const openai = new OpenAIApi(configuration);
	let shortSummary = vscode.commands.registerCommand('markdown-gpt.shortSummary', async () => {
		let input_text = getText();
		console.log(input_text);
		let messages: Array<ChatCompletionRequestMessage> = [
			{"role": "system", "content": "You are a helpful assistant."},
			{"role": "user", "content": `Consider this article:\n${input_text}`},
			{"role": "user", "content": "Please write a one sentence blurb of this article"},
		];
		let request: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			max_tokens: 60,
			n: 1,
			temperature: 0.5,
			messages: messages
		}
		let resp = await openai.createChatCompletion(request);
		let { choices } = resp.data;
		let [first_choice] = choices;
		let summary = first_choice.message?.content;
		vscode.window.showInformationMessage(`Suggested summary:${summary}`);
	});

	context.subscriptions.push(ping, shortSummary);
}

function getText() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
	  vscode.window.showErrorMessage("No active editor");
	  return;
	}
  
	const selection = editor.selection;
	return editor.document.getText(selection);
  
}

// This method is called when your extension is deactivated
export function deactivate() {}
