// import { createParser } from "eventsource-parser";
// import pkg from "../config/pinecone.js";
// const { pineconeStore } = pkg;

// export const reply = async (req, res) => {
//   const { question } = req.body;
//   let data;
//   try {
//     data = await pineconeStore.similaritySearch(question, 5);
//   } catch (err) {
//     res.status(404).send({ message: `${question} doesn't match any search` });
//   }

//   const prompt = `
//   The user has a question: "${question}"`;

//   // To help answer this question, you have access to the following passages:

//   // ${data.map((d, idx) => `Passage ${idx + 1}: ${d.pageContent}`).join("\n\n")}

//   // Please provide a well-informed and concise response to the user's query, referencing the information from the passages when necessary.
//   // `;

//   const stream = await fun(prompt);

//   const reader = stream.getReader();
//   const decoder = new TextDecoder();
//   let done = false;
//   let answer = "";
//   while (!done) {
//     const { value, done: doneReading } = await reader.read();
//     done = doneReading;
//     const chunkValue = decoder.decode(value);
//     answer += chunkValue;
//   }

//   res.status(200).send({ answer: answer, citations: data });
// };

// const fun = async (prompt) => {
//   const encoder = new TextEncoder();
//   const decoder = new TextDecoder();
//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     method: "POST",
//     body: JSON.stringify({
//       model: "gpt-3.5-turbo",
//       messages: [
//         // {
//         //   role: "system",
//         //   content: `You are an AI language model, and you have access to a set of documents uploaded by the user. These documents have been converted to vector embeddings and stored in a Pinecone database. Your purpose is to provide answers and insights based on the context of these documents, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.`,
//         // },
//         {
//           role: "user",
//           content: prompt,
//         }
//         // {
//         //   role: "assistant",
//         //   content: "Can you please provide more information or clarify your question if my previous response didn't fully answer your query?",
//         // },
//       ],
//       max_tokens: 1500,
//       temperature: 0.4,
//       stream: true,
//     }),
//   });

//   const stream = new ReadableStream({
//     async start(controller) {
//       const onParse = (event) => {
//         if (event.type === "event") {
//           const data = event.data;

//           if (data === "[DONE]") {
//             controller.close();
//             return;
//           }

//           try {
//             const json = JSON.parse(data);
//             const text = json.choices[0].delta.content;
//             const queue = encoder.encode(text);
//             controller.enqueue(queue);
//           } catch (e) {
//             controller.error(e);
//           }
//         }
//       };

//       const parser = createParser(onParse);

//       for await (const chunk of response.body) {
//         parser.feed(decoder.decode(chunk));
//       }
//     },
//   });

//   return stream;
// };

import { createParser } from "eventsource-parser";
import pkg from "../config/pinecone.js";
const { pineconeStore } = pkg;

export const answerQnA = async (req, res) => {
  console.log("QnA");
  const { question } = req.body;
  console.log(question);
  let data;
  const numSimilarResults = 5;
  const similarityThreshold = 0.8; // Change this value to adjust the similarity threshold

  try {
    data = await pineconeStore.similaritySearchWithScore(
      question,
      numSimilarResults
    );
  } catch (err) {
    res.status(404).send({ message: `${question} doesn't match any search` });
  }

  const filteredData = data
    .filter((d) => d[1] >= similarityThreshold)
    .sort((a, b) => {
      const aRelevance = isFilenameRelevant(a[0].metadata.file, question);
      const bRelevance = isFilenameRelevant(b[0].metadata.file, question);

      if (aRelevance && !bRelevance) {
        return -1;
      } else if (!aRelevance && bRelevance) {
        return 1;
      } else {
        return b[1] - a[1];
      }
    });

  const stream = await fun(filteredData, question);

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

  console.log(filteredData);

  res.status(200).send({ answer: answer, citations: filteredData });
};

const isFilenameRelevant = (filename, question) => {
  const keywords = filename.split(/[\s-_]+/).map((word) => word.toLowerCase());
  const questionWords = question.split(/\s+/).map((word) => word.toLowerCase());

  return questionWords.some((word) => keywords.includes(word));
};

const fun = async (filteredData, question) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let files = "";
  for (const obj of filteredData) {
    const filename = obj[0].metadata.file;
    files += filename + ", ";
  }

  const combinedPassages = filteredData
    .map((d, idx) => `Passage ${idx + 1}: ${d[0].pageContent}`)
    .join("\n\n");

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
          content: `You are Gutenberg's internal PR/content/about the company database assistant with access to all the documents in chunk format. Your name is Johannes. Your purpose is to help PR, content and other teams at Gutenberg with their queries and provide answers based on the context of the documents and the input query provided. If they ask anything about Gutenberg be very specific in answering and just answer according to the best result. You can present your answers in various formats like lists, bullets, blogs with headers, different paragraphs, markdown (with headers, sub heading, body, lists), and tables as requested or as you feel. You need to provide citations in the text generated from the context used. ${files} are all the relevant file names, always include the ${files} name for each fact you use in the response. Change ${files} to numbers like 1, 2, 3, 4. Very important to keep in mind when assigning the numbers to the context, for each file names in ${files} assign just one number and repeat that number for the ${files}, this is very crucial to get it right. If ${files} contains one file name, then just use number 1 everywhere and if it contains two file names, then use number 1 and 2. Don't use multiple numbers for a single file name. Use square brackets to reference and bold the numbers, e.g. **[1]**. Don't combine the numbers, list each number separately, e.g. **[1] , [2]**. If it's not asked then don't return the solution for this. Very important always respond in "markdown".`,
        },
        {
          role: "user",
          content: `The user has a question: "${question}". To help answer this question, you have access to the following passages:

          ${combinedPassages}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0,
      stream: true,
    }),
  });
  // Also don't make up answer if you have the context then give the answer or else just return with Sorry, I don't have context on the question asked
  //  content: `You are Gutenberg's internal database assistant with access to all the documents in chunk format. Your purpose is to help employees with their queries and provide answers based on the context of the documents and the input query provided. You can present your answers in various formats such as lists, bullets, blogs with headers, different paragraphs, markdown lists, and tables as requested. You are also capable of running comparisons between different chunks of context from various documents to provide well-structured comparison analysis. This analysis can be based on various aspects, such as types of work done, fees given to different clients or companies by Gutenberg, or different types of workflows provided to clients by Gutenberg. You are also able to find the financial data and if asked do a competitive analysis, like comparing pricing given to all the clients by gutenberg and then return why the pricing differ on the basis of work involved and location of the deal. You can also go through all the files to find the total number of companies with whom gutenberg worked and give a correct result. Don't use any sentence with "copyright" in it. Focus on important things in the context and if ${question} contains "fees", "amount", "payment" or any of the synonyms, you'll find the requested question's answer in the context provided to you, it can be given with a currency symbol or abbreviation like "USD", "GBP", "INR". If you try harder which would be in a numerical string value, find that data in the context for any client of Gutenberg. If it's not asked then don't return the solution for this. Respond in markdown`,

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
