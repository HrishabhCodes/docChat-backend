import { ZeroShotAgent, initializeAgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models";
import { Calculator } from "langchain/tools";
import { SerpAPI } from "langchain/tools";
import { BufferMemory } from "langchain/memory";
import pkg from "../config/pinecone.js";
const { pineconeStore } = pkg;

const DOCUMENT_TEMPLATE_WITH_SOURCE = `
------------ BEGIN DOCUMENT -------------
--------------- CONTENT -----------------
{content}
---------------- SOURCE -----------------
{source}
------------- END DOCUMENT --------------
`;

const PROMPT_TEMPLATE = `
You are an AI language model, and you have access to a set of documents uploaded by the user. In each message you will be given the extracted parts of a knowledge base. You have the history of the conversation between you and the human (chat). Your purpose is to provide reply and insights based on the context of these documents and the previous conversation between you and the user, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge. First, try to search the answer from all the given documents and if the answer is not provided in the documents, then only search on Google.

History: {history}
Documents:
=========== BEGIN DOCUMENTS =============
{documents}
============ END DOCUMENTS ==============
Question: {input}
`;

const CHAT_TEMPLATE = `
Previous Question: {question}
Previous Answer: {answer}
`;

const SYSTEM_PROMPT = `
You are an AI language model, and you have access to a set of documents uploaded by the user. In each message you will be given the extracted parts of a knowledge base and a question. You have the history of the conversation between you and the human (Question). Your purpose is to provide answers and insights based on the context of these documents and the previous questions and answers between you and the user, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.
`;

function constructPrompt(documents, history) {
  const documentPrompts = documents
    .map((d) => constructDocumentPrompt(d))
    .join("\n");
  const historyPrompts = history.map((h) => constructChatPrompt(h)).join("\n");
  return PROMPT_TEMPLATE.replace("{documents}", documentPrompts).replace(
    "{history}",
    historyPrompts || "No history!"
  );
}

function constructDocumentPrompt(document) {
  return DOCUMENT_TEMPLATE_WITH_SOURCE.replace(
    "{content}",
    document.pageContent
  ).replace("{source}", document.metadata["file"]);
}

function constructChatPrompt(history) {
  return CHAT_TEMPLATE.replace("{answer}", history[1]).replace(
    "{question}",
    history[0]
  );
}

export const respond1 = async (req, res) => {
  const { question, history } = req.body;

  let data;
  try {
    data = await pineconeStore.similaritySearch(question, 5);
  } catch (err) {
    res.status(404).send({ message: `${question} doesn't match any search` });
  }

  const tools = [
    // new SerpAPI(
    //   "process.env.SERPAPI_API_KEY",
    //   {
    //     location: "Austin,Texas,United States",
    //     hl: "en",
    //     gl: "us",
    //   }
    // ),
    new Calculator(),
  ];

  let chatInput = constructPrompt(data, history);
  chatInput = chatInput.replace("{input}", question);
  console.log(chatInput);

  const model = new ChatOpenAI({
    temperature: 0,
  });

  const executor = await initializeAgentExecutor(
    tools,
    model,
    "chat-conversational-react-description",
    true
  );

  executor.memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input",
  });

  const response = await executor.call({ input: question });
  res.status(200).send({ answer: response.output, citations: data });
};
