import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { Calculator } from "langchain/tools";
// import { SerpAPI } from "langchain/tools";
import { BufferWindowMemory } from "langchain/memory";
import pkg from "../config/pinecone.js";
import { PromptTemplate } from "langchain";
const { pineconeStore } = pkg;

const DOCUMENT_TEMPLATE_WITH_SOURCE = `
{content}
`;

// const SYSTEM_PROMPT = `
// You are an AI language model, and you have access to a set of documents uploaded by the user. In each message you will be given the extracted parts of a knowledge base and a question. You have the history of the conversation between you and the human (Question). Your purpose is to provide answers and insights based on the context of these documents and the previous questions and answers between you and the user, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.
// `;

const PROMPT_TEMPLATE = `
You are an AI language model, and you have access to a set of documents uploaded by the user. In each message, you will be given the extracted parts of a knowledge base. You also have the history of the conversation between you and the human (chat). Your purpose is to provide a reply and insights based on the context of these documents and the previous conversation between you and the user, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.

History: {history}

Documents:
{documents}

Question: {input}
Answer:
`;

const CHAT_TEMPLATE = `
Previous Question: {question}
Previous Answer: {answer}
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
    //   "",
    //   {
    //     location: "Austin,Texas,United States",
    //     hl: "en",
    //     gl: "us",
    //   }
    // ),
    new Calculator(),
  ];

  let chatInput = constructPrompt(
    data,
    history.slice(Math.max(history.length - 5, 0))
  );
  const input = chatInput.replace("{input}", question);

  const prompt = PromptTemplate.fromTemplate(chatInput);

  const model = new ChatOpenAI({
    temperature: 0,
  });

  const memory = new BufferWindowMemory({ k: 5 });
  const chain = new ConversationChain({ llm: model, memory: memory });
  const response = await chain.call({ input });

  res.status(200).send({ answer: response.response, citations: data });
};
