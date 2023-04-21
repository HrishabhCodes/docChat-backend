// // export class IntelligentTextSplitter {
// //   constructor(options = {}) {
// //     this.chunkSize = options.chunkSize || 1000;
// //   }

// //   async splitDocuments(documents) {
// //     return Promise.all(documents.map((doc) => this.splitDocument(doc)));
// //   }

// //   async splitDocument(document) {
// //     const text = document.pageContent;
// //     const chunks = this.splitText(text);
// //     return chunks.map((chunk) => ({ ...document, text: chunk }));
// //   }

// //   splitText(text) {
// //     const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
// //     const chunks = [];
// //     let currentChunk = "";

// //     sentences.forEach((sentence) => {
// //       if (currentChunk.length + sentence.length < this.chunkSize) {
// //         currentChunk += sentence;
// //       } else {
// //         chunks.push(currentChunk);
// //         currentChunk = sentence;
// //       }
// //     });

// //     if (currentChunk) {
// //       chunks.push(currentChunk);
// //     }

// //     return chunks;
// //   }
// // }

// export class IntelligentTextSplitter {
//     constructor(options = {}) {
//       this.chunkSize = options.chunkSize || 1000;
//     }

//     async splitDocuments(documents) {
//       return Promise.all(documents.map((doc) => this.splitDocument(doc)));
//     }

//     async splitDocument(document) {
//       const text = document.pageContent;
//       const chunks = this.splitText(text);
//       return chunks.map((chunk) => ({ ...document, pageContent: chunk }));
//     }

//     splitText(text) {
//       const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
//       const chunks = [];
//       let currentChunk = "";

//       sentences.forEach((sentence) => {
//         if (currentChunk.length + sentence.length < this.chunkSize) {
//           currentChunk += sentence;
//         } else {
//           chunks.push(currentChunk);
//           currentChunk = sentence;
//         }
//       });

//       if (currentChunk) {
//         chunks.push(currentChunk);
//       }

//       return chunks;
//     }
//   }
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

export class IntelligentTextSplitter {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 300;
  }

  async splitDocuments(documents) {
    const allDocs = await Promise.all(
      documents.map(async (doc) => {
        const result = await this.splitDocument(doc);
        return result;
      })
    );
    return allDocs.flat();
  }

  async splitDocument(document) {
    const text = document.pageContent;
    const chunks = this.splitText(text);
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const obj = { ...document, pageContent: chunk };
        return new Document(obj);
      })
    );
    return results;
  }

  splitText(text) {
    const paragraphs = text.split(/\n\s*\n/);
    let chunks = [];
    let currentChunk = "";

    paragraphs.forEach((paragraph) => {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      sentences.forEach((sentence) => {
        if (currentChunk.length + sentence.length + 1 <= this.chunkSize) {
          currentChunk += sentence + " ";
        } else {
          chunks.push(currentChunk.trim());
          currentChunk = sentence + " ";
        }
      });

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
    });

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

// export class IntelligentTextSplitter {
//   constructor(options = {}) {
//     this.chunkSize = options.chunkSize || 300;
//   }

//   async splitDocuments(documents) {
//     const allDocs = await Promise.all(
//       documents.map(async (doc) => {
//         const result = await this.splitDocument(doc);
//         return result;
//       })
//     );
//     return allDocs.flat();
//   }

//   async splitDocument(document) {
//     const text = document.pageContent;
//     const chunks = this.splitText(text);
//     const results = await Promise.all(
//       chunks.map(async (chunk) => {
//         // const textSplitter = new RecursiveCharacterTextSplitter({
//         //   chunkSize: 1000,
//         //   chunkOverlap: 200,
//         // });
//         const obj = { ...document, pageContent: chunk };
//         return new Document(obj);
//         // const docs = await textSplitter.createDocuments(
//         //   [obj.pageContent],
//         //   [obj.metadata]
//         // );
//         // return docs;
//       })
//     );

//     return results;
//   }

//   splitText(text) {
//     const paragraphs = text.split(/\n\s*\n/); // Split text into paragraphs
//     const chunks = [];
//     let currentChunk = "";

//     paragraphs.forEach((paragraph) => {
//       if (currentChunk.length + paragraph.length < this.chunkSize) {
//         currentChunk += paragraph + "\n\n";
//       } else {
//         chunks.push(currentChunk);
//         currentChunk = paragraph + "\n\n";
//       }
//     });

//     if (currentChunk) {
//       chunks.push(currentChunk);
//     }

//     return chunks.slice(1);
//   }
// }
