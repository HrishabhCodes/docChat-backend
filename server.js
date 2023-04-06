//server.js

/**
Import required langchain and pinecone library like in ./embed.js
**/
import { PineconeStore } from "langchain/vectorstores";
import { index } from "./pinecone.js";
import { OpenAIEmbeddings } from "langchain/embeddings";
const embedder = new OpenAIEmbeddings();
const pineconeStore = new PineconeStore(embedder, {
  pineconeIndex: index,
  namespace: "docs-pdf",
});

/**
Init express app
**/
import express from "express";
const app = express();
const port = 9000;

app.get("/delete", async (req, res) => {
  const namespace = req.query.namespace;
  if (!namespace) {
    res.status(404).send({ message: `Please provide the namespace!` });
  }
  await index.delete1({ deleteAll: true, namespace });
  res.status(200).send({ message: `Deleted all vectors of '${namespace}'!` });
});

app.get("/", async (req, res) => {
  const { q } = req.query;
  try {
    const data = await pineconeStore.similaritySearch(q, 5);
    res.status(200).send([...data]);
  } catch (err) {
    res.status(404).send({ message: `${q} doesn't match any search` });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
