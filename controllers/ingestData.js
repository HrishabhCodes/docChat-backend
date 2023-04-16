import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeStore } from "langchain/vectorstores";
import { CustomPDFLoader } from "../utils/customPDFLoader.js";
import pkg from "../config/pinecone.js";
const { index } = pkg;
import { DirectoryLoader } from "langchain/document_loaders";

/* Name of directory to retrieve your files from */
const filePath = "docs";

const run = async (files) => {
  try {
    /* load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      ".pdf": (path) => new CustomPDFLoader(path),
    });

    const rawDocs = await directoryLoader.load();

    for (const doc of rawDocs) {
      const text = doc.pageContent;
      let cleanedText = text.replace(/\s+/g, " ");
      cleanedText = cleanedText.replace(/\.([a-zA-Z])/g, ". $1");
      doc.pageContent = cleanedText;
    }

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log("creating vector store...");

    /* create and store the embeddings in the vectorStore */
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: process.env.PINECONE_NAMESPACE,
      textKey: "text",
    });
    console.log("ingestion done!");
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to ingest your data");
  }
};

// (async () => {
//   await run();
//   console.log("ingestion complete");
// })();

export default run;
