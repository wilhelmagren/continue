import { BaseLLM } from "..";
import { CompletionOptions, LLMOptions, ChatMessage } from "../..";

class BedrockPrivate extends BaseLLM {
    static providerName = "bedrockprivate";
    static defaultOptions: Partial<LLMOptions> = {
        region: "us-east-1",
        model: "custom.model",
        contextLength: 100_000
    };

    apiBase: string | undefined;
    gatewayId: string | undefined;
    apiKey: string  | undefined;

    constructor(options: LLMOptions) {
        super(options);
        this.apiBase = options.apiBase;
        this.gatewayId = options.gatewayId;
        this.apiKey = options.apiKey;
    }

    protected async *_streamComplete(
        prompt: string,
        signal: AbortSignal,
        options: CompletionOptions,
    ): AsyncGenerator<string> {
        const originalHttpProxy = process.env.HTTP_PROXY;
        const originalHttpsProxy = process.env.HTTPS_PROXY;

        try {
            // Unset the environment variables if process is defined
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;

            const response = await fetch(this.getEndpoint("llm/generate"), {
                method: "POST",
                headers: {
                    ...(this.apiBase && { "Host": this.apiBase }),
                    ...(this.gatewayId && { "x-apigw-api-id": this.gatewayId }),
                    "Content-Type": "application/json",
                    ...(this.apiKey && { "x-api-key": this.apiKey })
                },
                body: JSON.stringify(this._getGenerateOptions(prompt, options))
            });

            // Process the response (assuming JSON response)
            const data = await response.json();
            for (const chunk of data.chunks) {
                yield chunk;
            }
        } finally {
            // Reset the environment variables if process is defined
            if (originalHttpProxy) {
                process.env.HTTP_PROXY = originalHttpProxy;
            }
            if (originalHttpsProxy) {
                process.env.HTTPS_PROXY = originalHttpsProxy;
            }
        }
    }

    protected async *_streamChat(
        messages: ChatMessage[],
        signal: AbortSignal,
        options: CompletionOptions,
    ): AsyncGenerator<ChatMessage> {
        const originalHttpProxy = process.env.HTTP_PROXY;
        const originalHttpsProxy = process.env.HTTPS_PROXY;

        try {
            // Unset the environment variables if process is defined
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;

            const response = await fetch(this.getEndpoint("llm/chat"), {
                method: "POST",
                headers: {
                    ...(this.apiBase && { "Host": this.apiBase }),
                    ...(this.gatewayId && { "x-apigw-api-id": this.gatewayId }),
                    "Content-Type": "application/json",
                    ...(this.apiKey && { "x-api-key": this.apiKey })
                },
                body: JSON.stringify({ messages, options })
            });

            // Process the response (assuming JSON response)
            const data = await response.json();
            for (const chunk of data.chunks) {
                yield chunk;
            }
        } finally {
            // Reset the environment variables if process is defined
            if (originalHttpProxy) {
                process.env.HTTP_PROXY = originalHttpProxy;
            }
            if (originalHttpsProxy) {
                process.env.HTTPS_PROXY = originalHttpsProxy;
            }
        }
    }

    private _getGenerateOptions(prompt: string, options: CompletionOptions) {
        return {
            prompt,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            stop: options.stop
        };
    }

    private getEndpoint(path: string): string {
        return `${this.apiBase}/${path}`;
    }
}

export default BedrockPrivate;