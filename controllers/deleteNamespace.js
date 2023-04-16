import pkg from "../config/pinecone.js";
const { index } = pkg;

export const deleteNamespace = async (req, res) => {
  const namespace = req.query.namespace;
  if (!namespace) {
    res.status(404).send({ message: `Please provide the namespace!` });
  }
  await index.delete1({ deleteAll: true, namespace });
  res.status(200).send({ message: `Deleted all vectors of '${namespace}'!` });
};
