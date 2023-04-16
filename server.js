import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import multer from "multer";
import * as dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
const app = express();
const port = 9000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { reply } from "./controllers/query.js";
import { answer } from "./controllers/makeChain.js";
import { respond1 } from "./controllers/queryChain.js";
import { deleteNamespace } from "./controllers/deleteNamespace.js";
import { uploadFiles } from "./controllers/uploadFiles.js";
import apiRoutes from "./routes/api.js";

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./docs");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.array("files"), uploadFiles);
app.use("/api", apiRoutes);
app.use("/docs", express.static(path.join(__dirname, "uploadedDocs")));
app.get("/delete", deleteNamespace);
// app.post("/query", answer);
app.post("/query", respond1);
// app.post("/query", reply);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
