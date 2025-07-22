# monk
an razor-thin QOL wrapper around OpenAI's Responses API

## usage

```js
import Monk from './monk.js';
// ...
const monk = new Monk('gpt-4o');
monk.addMessage('developer', 'You are a helpful AI agent.');
monk.addToolFunction({
    name: 'get_date',
    description: 'Get the current date and time.',
    parameters: {
        'type': 'object',
        properties: {
            timezone: { 'type': string }
        },
    }
    callback: () => (new Date()).toString()
});
const completion = await monk.respond('What\'s the date tomorrow?');
```
