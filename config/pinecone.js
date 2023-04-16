//pinecone.js

/**
Read .env
**/
import * as dotenv from "dotenv";
dotenv.config();

/**
Init Pinecone
**/
import { PineconeStore } from "langchain/vectorstores";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings";
const pinecone = new PineconeClient();
const environment = process.env.PINECONE_ENVIRONMENT;
const apiKey = process.env.PINECONE_API_KEY;

await pinecone.init({
  environment: environment,
  apiKey: apiKey,
});

/**
Export the pinecone index function, named it based on your created index in pinecone. We will need this for Pinecone langchain wrapper.
**/
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
const embedder = new OpenAIEmbeddings();
const pineconeStore = new PineconeStore(embedder, {
  pineconeIndex: index,
  namespace: process.env.PINECONE_NAMESPACE,
});

export default { index, pineconeStore };
