import { OpenAI } from "openai";
// Here defines a Singleton class OpenAIService that wraps the OpenAI API client.
class OpenAIService {
  private static instance: OpenAIService;
  private openai!: OpenAI;

  public constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  // apiKey can be a string or undefined
  static getInstance(apiKey?: string): OpenAIService {
    if (!apiKey) {
      throw new Error("OPENAI API Key is required");
    }
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService(apiKey);
    }
    return OpenAIService.instance;
  }


  async productSearch(
    msg: { role: string; content: string }[],
    model: string = "gpt-3.5-turbo"
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessage[]> {
    try {
      // Create a thread (if you're using a threaded conversation model)
      const thread = await this.openai.beta.threads.create();
      console.log("Thread created:", thread.id, msg);

      // Add the initial message to the thread
      const message = await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: msg[0].content,
      });

      // Start a run (if the assistant requires one)
      let run = await this.openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: "asst_XeYc17zgeLsYMV3XiGPGNG7A"
      });

      // Poll until the run is complete
      while (run.status !== 'completed') {
        run = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
        console.log(run.status);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (run.status === 'completed') {
        // Retrieve messages after completion
        const messages = await this.openai.beta.threads.messages.list(run.thread_id);
        let temp = [];
        for (const message of messages.data.reverse()) {
          temp.push({ role: message.role, content: message.content[0].text.value });
        }

        // Return the last message from the assistant
        return temp;

      } else {
        console.log(`Run status: ${run.status}`);
        throw new Error("Run did not complete successfully");
      }

    } catch (error) {
      console.error("Error during product search:", error);
      throw error;
    }
  }


  async generateText(
    msg: [],
    model: string = "gpt-3.5-turbo"
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: msg,
      });

      if (response && response.choices && response.choices.length > 0) {
        return response.choices[0].message;
      } else {
        throw new Error("No text generated");
      }
    } catch (error) {
      console.error("Error generating text:", error);
      throw error;
    }
  }

  async generateTextStream(msg: []): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: msg,
        stream: true,
      });

      return response;
    } catch (error) {
      console.error("Error generating text:", error);
      throw error;
    }
  }

  async generateImage(
    prompt: string,
    amount: string = "1",
    resolution: OpenAI.ImageGenerateParams["size"] = "1024x1024"
  ): Promise<OpenAI.Images.Image[]> {
    try {
      // Logic for processing the messages and interacting with OpenAI can go here
      const response = await this.openai.images.generate({
        prompt: prompt,
        size: resolution,
        n: parseInt(amount, 10),
      });

      if (response && response.data && response.data.length > 0) {
        return response.data;
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }
}



export default OpenAIService;
