import OpenAI from 'openai';

const Message = Object.freeze({
    FUNCTION_CALL: 'function_call',
    FUNCTION_CALL_OUTPUT: 'function_call_output',
});

export default function Monk(model = 'gpt-4.1') {
    this.client = new OpenAI();
    this.model = model;
    this.messages = [];
    this.tools = [];
    this.functions = {};

    this.addMessage = (role, content) => {
        this.messages.push({ role, content });
    };

    this.addToolFunction = (options = {}) => {
        // name, description, parameters, fn
        const assertVar = (key) => {
            if (options.hasOwnProperty(key)) {
                return options[key];
            } else {
                throw new Error(`required argument missing: ${key}`);
            }
        };

        const name = assertVar('name');

        if (this.tools.find(tool => tool.name === name)) {
            throw new Error('tool with name already exists');
        }

        const tool = {
            type: 'function',
            name,
            description: assertVar('description'),
        };

        try { tool.parameters = assertVar('parameters'); } catch {}
        try { tool.strict = assertVar('strict'); } catch {}

        this.tools.push(tool);
        this.functions[name] = assertVar('callback');
    };

    this.__respond = async () => {
        return await this.client.responses.create({
            model: this.model,
            input: this.messages,
            tools: this.tools,
        });
    };

    this.respond = async (prompt) => {
        this.addMessage('user', prompt);

        let isResponseNeeded = true;
        let response = await this.__respond();

        while (isResponseNeeded && response.output) {
            isResponseNeeded = false;

            for (const toolCall of response.output) {
                if (toolCall.type !== Message.FUNCTION_CALL) {
                    continue;
                }

                const args = JSON.parse(toolCall.arguments);
                const output = await this.functions[toolCall.name](args);

                this.messages.push(toolCall);
                this.messages.push({
                    type: Message.FUNCTION_CALL_OUTPUT,
                    call_id: toolCall.call_id,
                    output,
                });

                isResponseNeeded = true;
            }

            if (isResponseNeeded) {
                response = await this.__respond();
            }
        }

        const responseText = response.output_text;
        this.addMessage('assistant', responseText);

        return responseText;
    };
}
