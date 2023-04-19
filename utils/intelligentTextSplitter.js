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

export class IntelligentTextSplitter {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
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
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const obj = { ...document, pageContent: chunk };
        const docs = await textSplitter.createDocuments(
          [obj.pageContent],
          [obj.metadata]
        );
        return docs;
      })
    );
    return results.flat();
  }

  splitText(text) {
    const paragraphs = text.split(/\n\s*\n/); // Split text into paragraphs
    const chunks = [];
    let currentChunk = "";

    paragraphs.forEach((paragraph) => {
      if (currentChunk.length + paragraph.length < this.chunkSize) {
        currentChunk += paragraph + "\n\n";
      } else {
        chunks.push(currentChunk);
        currentChunk = paragraph + "\n\n";
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.slice(1);
  }
}
