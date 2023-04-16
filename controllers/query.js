import { createParser } from "eventsource-parser";
import pkg from "../config/pinecone.js";
const { pineconeStore } = pkg;

export const reply = async (req, res) => {
  const { question } = req.body;
  let data;
  try {
    data = await pineconeStore.similaritySearch(question, 5);
  } catch (err) {
    res.status(404).send({ message: `${question} doesn't match any search` });
  }

  const prompt = `
      Use the following passages to provide an answer to the query: "${question}"
  
      ${data.map((d) => d.pageContent).join("\n\n")}
      `;

  const stream = await fun(prompt);

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let answer = "";
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    answer += chunkValue;
  }

  res.status(200).send({ answer: answer, citations: data });
};

const fun = async (prompt) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI language model, and you have access to a set of documents uploaded by the user. These documents have been converted to vector embeddings and stored in a Pinecone database. Your purpose is to provide answers and insights based on the context of these documents, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.`,

          // `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided. Make sure the answer provided by you should be  precise. Complete the task given to you by all means and provide a good precise answer.
          // You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.`
          // `You are an AI language model, and you have access to a set of documents uploaded by the user. These documents have been converted to vector embeddings and stored in a Pinecone database. Your purpose is to provide answers and insights based on the context of these documents, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.
          //     `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.0,
      stream: true,
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event) => {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of response.body) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
