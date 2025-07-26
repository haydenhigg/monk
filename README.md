# monk
a razor-thin QOL wrapper around OpenAI's Responses API

## usage
#### 1. import and create
```js
import Monk from 'monkai';
const monk = new Monk('gpt-4o');
```

#### 2. add tools
```js
monk.toolbox.create({
    name: 'say_hi',
    description: 'Say hi!',
    parameters: {
        'type': 'object',
        properties: {
            name: { 'type': 'string' },
        },
    },
    callback: ({ name }) => {
        if (name) {
            console.log(`Hi ${name}!`);
        } else {
            console.log('Hi!');
        }

        return { status: 'success' };
    },
});
monk.toolbox.create({
    name: 'get_date',
    description: 'Get the current date and time.',
    callback: () => new Date().toString(),
});
```

#### 3. add messages and get responses
```js
monk.addMessage(Monk.DEVELOPER, 'You are a helpful and friendly AI assistant.');
const completion = await monk.respond('Hello! My name is Hayden. What is the date tomorrow?');
```

... or equivalently ...

```js
monk.addMessage(Monk.DEVELOPER, 'You are a helpful and friendly AI assistant.');
monk.addMessage(Monk.USER, 'What is the date tomorrow?');
const completion = await monk.respond();
````

## complete API
- `constructor(model: string)`
- `.client: OpenAI`: underlying OpenAI client
- `.model: string`: model string provided in constructor
- `.messages: object[]`: all input messages, including sent messages as well as queued messages
- `.toolbox: ToolBox`
    - `.create(options: object)`: create a function tool. `options`:
        - `name: string` (required)
        - `description: string` (required)
        - `callback: (args: object) => any` (required)
        - `parameters: object`
        - `strict: boolean`
    - `.call(toolCall: object)`: call a function tool. `toolCall`:
        - `name: string` (required)
        - `arguments: object` (required)
- `.addMessage(role: Monk.USER | Monk.DEVELOPER, content: string)`: queue a new message
- `async .respond(prompt: string | null)`: adds prompt as a user message if provided, then gets a response from OpenAI, calling tools automatically
