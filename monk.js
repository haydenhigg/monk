import OpenAI from 'openai';

const MessageType = Object.freeze({
    FUNCTION_CALL: 'function_call',
    FUNCTION_CALL_OUTPUT: 'function_call_output',
});

function Toolbox() {
    const assertProperty = (obj, key) => {
        if (obj.hasOwnProperty(key)) {
            return obj[key];
        } else {
            throw new Error(`required argument missing: ${key}`);
        }
    };

    this.tools = [];
    this.functions = {};

    this.create = (options = {}) => {
        const name = assertProperty(options, 'name');
        const description = assertProperty(options, 'description');
        const callback = assertProperty(options, 'callback');

        if (this.tools.find(tool => tool.name === name)) {
            throw new Error('tool with name already exists');
        }

        const tool = { type: 'function', name, description };

        try { tool.parameters = assertProperty(options, 'parameters'); } catch {}
        try { tool.strict = assertProperty(options, 'strict'); } catch {}

        this.tools.push(tool);
        this.functions[name] = callback;
    };

    this.call = async (toolCall = {}) => {
        const name = assertProperty(toolCall, 'name');
        const args = JSON.parse(assertProperty(toolCall, 'arguments'));
        return JSON.stringify((await this.functions[name](args)) || 'success');
    };
}

function Monk(model) {
    this.client = new OpenAI();

    this.model = model;
    this.messages = [];
    this.toolbox = new Toolbox();

    this.addMessage = (role, content) => {
        this.messages.push({ role, content });
    };

    this.__respondToMessages = async () => {
        return await this.client.responses.create({
            model: this.model,
            input: this.messages,
            tools: this.toolbox.tools,
        });
    };

    this.respond = async (prompt) => {
        if (prompt) {
            this.addMessage(Monk.USER, prompt);
        }

        let response = await this.__respondToMessages();

        while (response.output) {
            let isResponseNeeded = false;

            for (const message of response.output) {
                delete message.id;
                this.messages.push(message);

                if (message.type !== MessageType.FUNCTION_CALL) {
                    continue;
                }

                this.messages.push({
                    type: MessageType.FUNCTION_CALL_OUTPUT,
                    call_id: message.call_id,
                    output: await this.toolbox.call(message),
                });

                isResponseNeeded = true;
            }

            if (isResponseNeeded) {
                response = await this.__respondToMessages();
            } else {
                break;
            }
        }

        return response.output_text;
    };
}

['USER', 'DEVELOPER', 'ASSISTANT'].forEach(role => {
    Object.defineProperty(Monk, role, {
        value: role.toLowerCase(),
        writable: false,
        configurable: false,
        enumerable: false,
    });
});

export default Monk;
