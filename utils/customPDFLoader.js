import { Document } from "langchain/document";
import { readFile } from "fs/promises";
import { BaseDocumentLoader } from "langchain/document_loaders";
import { PDFExtract } from "pdf.js-extract";

class BufferLoader extends BaseDocumentLoader {
  constructor(filePathOrBlob) {
    super();
    this.filePathOrBlob = filePathOrBlob;
  }

  async parse(raw, metadata) {
    throw new Error("Not implemented");
  }

  async load() {
    let buffer;
    let metadata;
    if (typeof this.filePathOrBlob === "string") {
      buffer = await readFile(this.filePathOrBlob);
      let fileName = this.filePathOrBlob.split("/");
      fileName = fileName[fileName.length - 1];
      metadata = {
        source: `http://localhost:9000/uploadedDocs/${fileName}`,
        file: fileName,
      };
    } else {
      const ab = await this.filePathOrBlob.arrayBuffer();
      buffer = Buffer.from(ab);
      metadata = { source: "blob", blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomPDFLoader extends BufferLoader {
  async parse(raw, metadata) {
    // const { pdf } = await PDFLoaderImports();
    const pdfExtract = new PDFExtract();
    const options = {};
    const data = await new Promise((resolve, reject) => {
      pdfExtract.extract(this.filePathOrBlob, options, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });

    let str = "";

    for (const page of data.pages) {
      const contentArr = page.content;
      for (const contentChunk of contentArr) {
        str += contentChunk.str + " ";
      }
    }

    const { meta } = data;
    const { info } = meta;
    let fileMetadata;
    if (meta.metadata) {
      fileMetadata = meta.metadata["_metadata"];
    }
    return [
      new Document({
        pageContent: str,
        metadata: {
          ...metadata,
          title: info.Title,
          author: info.Author || "unknown",
          producer: info.Producer,
          createdAt: fileMetadata && fileMetadata["xmp:createdate"],
          pdf_numpages: data.pages.length,
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js");
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      "Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`."
    );
  }
}
