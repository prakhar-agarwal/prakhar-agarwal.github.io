import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("explainer-submit");
    const inputEl = document.getElementById("explainer-input");
    const outputEl = document.getElementById("explainer-output");
    const statusEl = document.getElementById("explainer-status");
    
    let engine = null;
    let isGenerating = false;

    // Use Gemma 3 1B if available, otherwise fallback to Gemma 2
    // You can check the browser console for supported models if this one throws an error
    const MODEL_ID = "gemma-3-1b-it-q4f16_1-MLC"; 

    const SYSTEM_PROMPT = `You are the 'Intuition Gap' Explainer, created by Prakhar Agarwal. 
Your job is to take an ML buzzword or phrase and explain the treacherous implementation details, 
hidden assumptions, and actual working mechanism behind it in intuitive, gritty terms. 
Do not give textbook definitions. Give the reality of implementing it, based on the intuition gap.
Keep your answer concise (under 150 words).`;

    async function initializeEngine() {
        if (engine) return engine;
        
        statusEl.innerText = "Initializing WebGPU Engine (Downloading weights, this will take a minute on first run)...";
        submitBtn.disabled = true;
        
        try {
            engine = await CreateMLCEngine(MODEL_ID, {
                initProgressCallback: (report) => {
                    statusEl.innerText = report.text;
                }
            });
            statusEl.innerText = "Model loaded successfully. Ready!";
            submitBtn.disabled = false;
            return engine;
        } catch (error) {
            console.error("WebLLM Error:", error);
            // Fallback attempt if Gemma-3 isn't natively bundled in this version of the CDN
            try {
                statusEl.innerText = "Gemma-3 not found in prebuilts. Falling back to Gemma-2 2B...";
                engine = await CreateMLCEngine("gemma-2b-it-q4f32_1-MLC", {
                    initProgressCallback: (report) => {
                        statusEl.innerText = report.text;
                    }
                });
                statusEl.innerText = "Fallback Model loaded successfully. Ready!";
                submitBtn.disabled = false;
                return engine;
            } catch (fallbackError) {
                statusEl.innerText = "Error: " + fallbackError.message + " (Check console)";
                return null;
            }
        }
    }

    async function handleExplainer() {
        const query = inputEl.value.trim();
        if (!query || isGenerating) return;

        isGenerating = true;
        submitBtn.disabled = true;
        outputEl.innerHTML = "";
        
        if (!engine) {
            await initializeEngine();
        }

        if (!engine) {
            outputEl.innerHTML = "<em>Failed to initialize engine. Your browser might not support WebGPU.</em>";
            isGenerating = false;
            submitBtn.disabled = false;
            return;
        }

        statusEl.innerText = "Generating intuition...";
        
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Explain the intuition gap for: "${query}"` }
        ];

        try {
            const chunks = await engine.chat.completions.create({
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 250
            });

            let currentText = "";
            for await (const chunk of chunks) {
                const text = chunk.choices[0]?.delta?.content || "";
                currentText += text;
                // Basic markdown to HTML (just for newlines and bold in this simple UI)
                const formattedHtml = currentText
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                outputEl.innerHTML = formattedHtml;
            }
            statusEl.innerText = "Done!";
        } catch (err) {
            outputEl.innerHTML = `<em>Error during generation: ${err.message}</em>`;
            statusEl.innerText = "Error!";
        } finally {
            isGenerating = false;
            submitBtn.disabled = false;
        }
    }

    submitBtn.addEventListener("click", handleExplainer);
    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleExplainer();
    });
    
    // Automatically initialize in background when user focuses the input to save time
    inputEl.addEventListener("focus", () => {
        if (!engine && !statusEl.innerText.includes("Initializing")) {
            initializeEngine();
        }
    }, { once: true });
});
