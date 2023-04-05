//embed.js

/**
Read .env file
**/
import * as dotenv from "dotenv";
dotenv.config();

/**
Open AI Embedding wrapper from langchain
**/
import { OpenAIEmbeddings } from "langchain/embeddings";

/**
Chunk text/text splitter function from langchain
**/
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/**
Pinecone wrapper from langchain
**/
import { PineconeStore } from "langchain/vectorstores";

/**
Init fs
**/
import * as fs from "fs";

/**
Create text splitter with chunksize 1000 character
**/
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0,
});

/**
Init OpenAI Embeddings
**/
const embedder = new OpenAIEmbeddings();

/**
Get index from our pinecone.js
**/
import { index } from "./pinecone.js";

(async () => {
  //read article
  const fileJson = JSON.parse(
    fs.readFileSync("docs/all_pdfs_data.json", "utf8")
  );

  let documents = [];
  for (let i = 0; i < 1; i++) {
    const item = fileJson[i];
    const metadata = item.metadata;
    const dateStr = metadata["/CreationDate"];
    const regex = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;
    const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] =
      dateStr.match(regex);
    const date = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    );
    const isoString = date.toISOString().slice(0, -5);
    const document = await textSplitter.createDocuments([item.text], {
      metadatas: [{ file_name: item.file_name, category: "category_name" }],
      contentKey: "text",
    });
    for (let j = 0; j < document.length; j++) {
      const newMetadata = {
        file: item.file_name,
        title: metadata["/Title"],
        author: metadata["/Author"],
        producer: metadata["/Producer"],
        createdAt: isoString,
      };
      document[j].metadata = newMetadata;
    }
    documents = [...documents, ...document];
  }

  //store the splitted text to pinecone, in index "article" and namespace "langchain" (namespace is for filter purpose later, can be whatever you want)
  const uploadeddocs = await PineconeStore.fromDocuments(documents, embedder, {
    pineconeIndex: index,
    namespace: "new-test",
    textKey: "text",
  });

  console.log(uploadeddocs);
})();
