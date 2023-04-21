import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import multer from "multer";
import * as dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
const app = express();
const PORT = 9000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { answerQnA } from "./controllers/queryQnA.js";
import { answerGenerative } from "./controllers/queryGenerative.js";
// import { answer } from "./controllers/makeChain.js";
// import { respond1 } from "./controllers/queryChain.js";
import { deleteNamespace } from "./controllers/deleteNamespace.js";
import { uploadFiles } from "./controllers/uploadFiles.js";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import mongoose from "mongoose";

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
app.use("/auth", authRoutes);
app.use("/docs", express.static(path.join(__dirname, "uploadedDocs")));
app.get("/delete", deleteNamespace);
// app.post("/query", answer);
// app.post("/query", respond1);
app.post("/queryQnA", answerQnA);
app.post("/queryGenerative", answerGenerative);

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}...`);
    });
  })
  .catch((err) => console.log(err));
