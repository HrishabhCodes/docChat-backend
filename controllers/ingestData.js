import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeStore } from "langchain/vectorstores";
import { CustomPDFLoader } from "../utils/customPDFLoader.js";
import pkg from "../config/pinecone.js";
const { index } = pkg;
import { DirectoryLoader } from "langchain/document_loaders";
import fs from "fs";
import PDFParser from "pdf2json";
import { PDFExtract } from "pdf.js-extract";
import { IntelligentTextSplitter } from "../utils/intelligentTextSplitter.js";

/* Name of directory to retrieve your files from */
const filePath = "docs";

const run = async (files) => {
  try {
    /* load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      ".pdf": (path) => new CustomPDFLoader(path),
    });
    // /Users/hrishabh/Internship/Gutenberg/trying-embeddings/langchain-pinecone/docs/01 - Ujwal Resume.pdf
    const rawDocs = await directoryLoader.load();

    // console.log(rawDocs);

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

    // const textSplitter = new IntelligentTextSplitter();
    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log(docs[0]);
    // const docs = await textSplitter.splitDocuments(rawDocs);
    // console.log(docs);
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

// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { PineconeStore } from "langchain/vectorstores";
// import { CustomPDFLoader } from "../utils/customPDFLoader.js";
// import pkg from "../config/pinecone.js";
// const { index } = pkg;
// import { DirectoryLoader } from "langchain/document_loaders";

// class IntelligentTextSplitter {
//   constructor(options = {}) {
//     this.chunkSize = options.chunkSize || 1000;
//   }

//   async splitDocuments(documents) {
//     return Promise.all(documents.map((doc) => this.splitDocument(doc)));
//   }

//   async splitDocument(document) {
//     const text = document.pageContent;
//     const chunks = this.splitText(text);
//     return chunks.map((chunk) => ({ ...document, pageContent: chunk }));
//   }

//   splitText(text) {
//     const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
//     const chunks = [];
//     let currentChunk = "";

//     sentences.forEach((sentence) => {
//       if (currentChunk.length + sentence.length < this.chunkSize) {
//         currentChunk += sentence;
//       } else {
//         chunks.push(currentChunk);
//         currentChunk = sentence;
//       }
//     });

//     if (currentChunk) {
//       chunks.push(currentChunk);
//     }

//     return chunks;
//   }
// }

// /* Name of directory to retrieve your files from */
// const filePath = "docs";

// const run = async (files) => {
//   try {
//     /* load raw docs from the all files in the directory */
//     const directoryLoader = new DirectoryLoader(filePath, {
//       ".pdf": (path) => new CustomPDFLoader(path),
//     });

//     const rawDocs = await directoryLoader.load();

//     for (const doc of rawDocs) {
//       const text = doc.pageContent;
//       let cleanedText = text.split(/\s+/).join(" ");
//       cleanedText = cleanedText.split(/\.([a-zA-Z])/).join(". $1");
//       doc.pageContent = cleanedText;
//     }

//     /* Split text into chunks */
//     const textSplitter = new IntelligentTextSplitter({
//       chunkSize: 1000,
//     });

//     const docs = await textSplitter.splitDocuments(rawDocs);
//     console.log("creating vector store...");

//     /* create and store the embeddings in the vectorStore */
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: process.env.OPENAI_API_KEY,
//     });

//     // embed the PDF documents
//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       namespace: process.env.PINECONE_NAMESPACE,
//       textKey: "text",
//     });
//     console.log("ingestion done!");
//   } catch (error) {
//     console.log("error", error);
//     throw new Error("Failed to ingest your data");
//   }
// };

// export default run;

// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { PineconeStore } from "langchain/vectorstores";
// import { CustomPDFLoader } from "../utils/customPDFLoader.js";
// import pkg from "../config/pinecone.js";
// const { index } = pkg;
// import { DirectoryLoader } from "langchain/document_loaders";
// import { IntelligentTextSplitter } from "../utils/intelligentTextSplitter.js"; // Add this line

// /* Name of directory to retrieve your files from */
// const filePath = "docs";

// const run = async (files) => {
//   try {
//     /* load raw docs from the all files in the directory */
//     const directoryLoader = new DirectoryLoader(filePath, {
//       ".pdf": (path) => new CustomPDFLoader(path),
//     });

//     const rawDocs = await directoryLoader.load();

//     for (const doc of rawDocs) {
//       const text = doc.pageContent;
//       let cleanedText = text.replace(/\s+/g, " ");
//       cleanedText = cleanedText.replace(/\.([a-zA-Z])/g, ". $1");
//       doc.pageContent = cleanedText;
//     }

//     /* Split text into chunks */
//     const textSplitter = new IntelligentTextSplitter({ // Replace this line
//       chunkSize: 1000,
//     });

//     const docs = await textSplitter.splitDocuments(rawDocs);
//     console.log("creating vector store...");

//     /* create and store the embeddings in the vectorStore */
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: process.env.OPENAI_API_KEY,
//     });

//     // embed the PDF documents
//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       namespace: process.env.PINECONE_NAMESPACE,
//       textKey: "text",
//     });
//     console.log("ingestion done!");
//   } catch (error) {
//     console.log("error", error);
//     throw new Error("Failed to ingest your data");
//   }
// };

// // (async () => {
// //   await run();
// //   console.log("ingestion complete");
// // })();

// export default run;

// import fs from "fs";
// import pdfParse from "pdf-parse";

// import fs from "fs";
// import pdfParse from "pdf-parse";
// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { PineconeStore } from "langchain/vectorstores";
// import pkg from "../config/pinecone.js";
// const { index } = pkg;
// import { DirectoryLoader } from "langchain/document_loaders";
// import { CustomPDFLoader } from "../utils/customPDFLoader.js";
// import { IntelligentTextSplitter } from "../utils/intelligentTextSplitter.js";

// /* Name of directory to retrieve your files from */
// const filePath = "docs";

// const run = async (files) => {
//   try {
//     /* load raw docs from all files in the directory */
//     const directoryLoader = new DirectoryLoader(filePath, {
//       ".pdf": (path) => new CustomPDFLoader(path),
//     });

//     const rawDocs = await directoryLoader.load();
//     console.log("Raw documents:", rawDocs);

//     for (const doc of rawDocs) {
//       const text = doc.pageContent;
//       let cleanedText = text.replace(/\s+/g, " ");
//       cleanedText = cleanedText.replace(/\.([a-zA-Z])/g, ". $1");
//       doc.pageContent = cleanedText;
//     }

//     /* Split text into meaningful chunks */
//     const textSplitter = new IntelligentTextSplitter();

//     const docs = await textSplitter.splitDocuments(rawDocs);
//     console.log("Documents after splitting:", docs);

//     console.log("creating vector store...");

//     /* create and store the embeddings in the vectorStore */
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: process.env.OPENAI_API_KEY,
//     });
//     console.log("Embeddings instance created:", embeddings);

//     // embed the PDF documents
//     console.log("Docs and embeddings before PineconeStore.fromDocuments():", docs, embeddings);
//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       namespace: process.env.PINECONE_NAMESPACE,
//       textKey: "text",
//     });
//     console.log("ingestion done!");
//   } catch (error) {
//     console.log("error", error);
//     throw new Error("Failed to ingest your data");
//   }
// };

// export default run;

// import fs from "fs";
// import pdfParse from "pdf-parse";

// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { PineconeStore } from "langchain/vectorstores";
// import pkg from "../config/pinecone.js";
// const { index } = pkg;
// import { DirectoryLoader } from "langchain/document_loaders";
// import { CustomPDFLoader } from "../utils/customPDFLoader.js";
// import { IntelligentTextSplitter } from "../utils/intelligentTextSplitter.js";

// /* Name of directory to retrieve your files from */
// const filePath = "docs";

// const run = async (files) => {
//   try {
//     /* load raw docs from all files in the directory */
//     const directoryLoader = new DirectoryLoader(filePath, {
//       ".pdf": (path) => new CustomPDFLoader(path),
//     });

//     const rawDocs = await directoryLoader.load();

//     for (const doc of rawDocs) {
//       const text = doc.pageContent;
//       let cleanedText = text.replace(/\s+/g, " ");
//       cleanedText = cleanedText.replace(/\.([a-zA-Z])/g, ". $1");
//       doc.pageContent = cleanedText;
//     }

//     /* Split text into meaningful chunks */
//     const textSplitter = new IntelligentTextSplitter();
//     const docs = await textSplitter.splitDocuments(rawDocs);
//     console.log("creating vector store...");
//     /* create and store the embeddings in the vectorStore */
//     const embeddings = new OpenAIEmbeddings({
//       openAIApiKey: process.env.OPENAI_API_KEY,
//     });

//     // embed the PDF documents
//     await PineconeStore.fromDocuments(docs, embeddings, {
//       pineconeIndex: index,
//       namespace: process.env.PINECONE_NAMESPACE,
//       textKey: "text",
//     });
//     console.log("ingestion done!");
//   } catch (error) {
//     throw new Error("Failed to ingest your data");
//   }
// };

// export default run;
