import { createParser } from "eventsource-parser";
import { CallbackManager } from "langchain/callbacks";
import pkg from "../config/pinecone.js";
import { ConversationChain, loadQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
// import { OpenAIChat } from "langchain/llms";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts";
import { BufferMemory, BufferWindowMemory } from "langchain/memory";
import { makeChain } from "./chainUtil.js";
const { pineconeStore } = pkg;

export const answer = async (req, res) => {
  // console.log(req);
  const { question, history } = req.body;
  const sanitizedQuestion = question.trim().replaceAll("\n", " ");
  const chain = makeChain(pineconeStore);
  const response = await chain.call({
    question: sanitizedQuestion,
    chat_history: history || [],
  });
  // console.log(response);
  res
    .status(200)
    .send({ answer: response.text, citations: response.sourceDocuments });
};
