# GPT-Editor README

## Features

Use OpenAI's models to supercharge your writing. This extension allows you to select text and 

- Summarize it to a paragraph or a sentence.
- Change the tone to casual, friendly or professional.
- Fix the spelling and grammar.
- Improve the style in an opinionated way.
- Run a custom prompt of your own.

You can fully customise the model and creativity settings.

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

The only thing you need is an OpenAI API key. You can get one [here](https://platform.openai.com/account/api-keys).

This ensures you retain full control of your usage. In practice, with the `gpt-3.5-turbo` model it costs a few cents a month.

## Extension Settings

* `gpt-editor.openai_api_key`: Your API key from https://platform.openai.com/account/api-keys
* `gpt-editor.model`: One of the models supporting chat completion from https://platform.openai.com/docs/models/overview
* `gpt-editor.temperature`: Controls the creativity of the generated text. Lower values produce more conservative text that closely matches the input prompt, while higher values produce more unexpected and creative responses. A common range for this parameter is between 0.1 and 1.0, with lower values producing more conservative responses.
* `gpt-editor.top_p`: Controls the diversity of the generated text. This parameter represents the cumulative probability of the most likely tokens in the generated text. Lower values for top_p generate more diverse responses, while higher values generate more common responses. A common range for this parameter is between 0.3 and 0.9.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of GPT-Editor

---
