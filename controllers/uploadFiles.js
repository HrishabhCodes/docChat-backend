import run from "./ingestData.js";
import fs from "fs";

export const uploadFiles = async (req, res) => {
  const files = req.files;

  if (Array.isArray(files) && files.length > 0) {
    setTimeout(async () => {
      await run(files);
      await moveFiles();
      res.json(files);
    }, 1000);
  } else {
    throw new Error("File upload unsuccessful");
  }
};

async function moveFiles() {
  // Define the source and destination folders
  const sourceFolder = "docs";
  const destinationFolder = "uploadedDocs";

  // Get the list of files in the source folder
  const files = await fs.promises.readdir(sourceFolder);

  // Move each file from the source folder to the destination folder
  for (const file of files) {
    await fs.promises.rename(
      `${sourceFolder}/${file}`,
      `${destinationFolder}/${file}`
    );
  }
}
