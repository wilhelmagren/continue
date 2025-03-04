import { BaseLLM } from "..";
import { CompletionOptions, LLMOptions, ChatMessage } from "../..";
import { streamResponse } from "../stream.js";

class BedrockPrivate extends BaseLLM {
    static providerName = "bedrockprivate";
    static defaultOptions: Partial<LLMOptions> = {
        region: "us-north-1",
        contextLength: 100_000
    };

    constructor(options: LLMOptions) {
        super(options);
        this.apiBase = options.apiBase;
    }

    protected async *_streamComplete(
        prompt: string,
        signal: AbortSignal,
        options: CompletionOptions,
    ): AsyncGenerator<string> {
        const originalHttpProxy = process.env.HTTP_PROXY;
        const originalHttpsProxy = process.env.HTTPS_PROXY;
        const originalTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

        try {
            // Unset the environment variables if process is defined
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            const response = await fetch(this.getEndpoint("llm/generate"), {
                method: "POST",
                headers: this.requestOptions?.headers,
                body: JSON.stringify(this._getGenerateOptions(prompt, options)),
                signal,
            });

            if (!response.ok) {
                yield `Bad response: ${await response.json()}`;
            }
            yield await response.text();
        } finally {
            // Reset the environment variables if process is defined
            if (originalHttpProxy) {
                process.env.HTTP_PROXY = originalHttpProxy;
            }
            if (originalHttpsProxy) {
                process.env.HTTPS_PROXY = originalHttpsProxy;
            }
            if (originalTlsRejectUnauthorized) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsRejectUnauthorized;
            } else {
                delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
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
        const originalTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

        try {
            // Unset the environment variables if process is defined
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            const response = await fetch(this.getEndpoint("llm/chat"), {
                method: "POST",
                headers: this.requestOptions?.headers,
                body: JSON.stringify({ messages, options }),
                signal,
            });

            if (!response.ok) {
                yield { role: "system", content: `Bad response: ${await response.json()}` };
            }
            yield { role: "assistant", content: await response.text() };
        } finally {
            // Reset the environment variables if process is defined
            if (originalHttpProxy) {
                process.env.HTTP_PROXY = originalHttpProxy;
            }
            if (originalHttpsProxy) {
                process.env.HTTPS_PROXY = originalHttpsProxy;
            }
            if (originalTlsRejectUnauthorized) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsRejectUnauthorized;
            } else {
                delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
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