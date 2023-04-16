import { OpenAIChat } from "langchain/llms";
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { CallbackManager } from "langchain/callbacks";

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI language model, and you have access to a set of documents uploaded by the user. These documents have been converted to vector embeddings and stored in a Pinecone database. Your purpose is to provide answers and insights based on the context of these documents, while also using your own knowledge and understanding to provide thoughtful and relevant responses to complex questions. If the information is not directly available in the documents, you will do your best to provide them with a useful and well-informed response based on the context and your own knowledge.

Question: {question}
=========
{context}
=========
Answer in Markdown:`
);

export const makeChain = (vectorstore) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: "gpt-3.5-turbo", //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
    }),
    { prompt: QA_PROMPT }
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 5, //number of source documents to return
  });
};
