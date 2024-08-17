import { OpenAI } from "openai";
import fs from "fs";
import path from "path";

class OpenAIService {
  private static instance: OpenAIService;
  private openai!: OpenAI;

  public constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  static getInstance(apiKey?: string): OpenAIService {
    if (!apiKey) {
      throw new Error("OPENAI API Key is required");
    }
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService(apiKey);
    }
    return OpenAIService.instance;
  }

  async uploadImages(localPath: string) {
    console.log("Uploading image:", localPath);
    // Define the directory where the file will be saved
    const directory = path.join(process.cwd(), "public/assets");
    console.log("Absolute path:", directory + localPath);
    const file = await this.openai.files.create({
      file: fs.createReadStream(directory + localPath),
      purpose: "vision",
    });
    return file;
  }

  async productSearch(
    msgs: { role: string; content: any }[],
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessage[]> {
    const temp: { type: 'image_file' | 'text'; image_file?: { file_id: string }; text?: string }[] = [];

    for (const msg of msgs) {
      console.log("msg:", msg);
      if (msg.role === "user") {
        for (const content of msg.content) {
          console.log("content:", content);
          if (content.type === "image_url") {
            const file = await this.uploadImages(content.url);
            temp.push({
              type: "image_file",
              image_file: { file_id: file.id },
            });
          } else if (content.type === "text") {
            temp.push({
              type: "text",
              text: content.text, // Ensure content.text is a string
            });
          }
        }
      }
    }

    console.log("Temp:", temp);
    // @ts-ignore
    const thread = await this.openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: temp,
        }
      ]
    });

    console.log("Thread created:", thread.id);

    let run = await this.openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: "asst_XeYc17zgeLsYMV3XiGPGNG7A"
    });

    while (run.status !== 'completed') {
      run = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(run.status);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (run.status === 'completed') {
      const messages = await this.openai.beta.threads.messages.list(run.thread_id);
      const results = messages.data.reverse().map(message => ({
        role: message.role,
        // @ts-ignore
        content: message.content[0]?.text?.value || ''
      }));

      // @ts-ignore
      return results;
    } else {
      console.log(`Run status: ${run.status}`);
      throw new Error("Run did not complete successfully");
    }
  }

}

export default OpenAIService;
