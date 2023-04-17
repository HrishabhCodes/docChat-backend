import fs from "fs";
import Papa from "papaparse";

const getData = (req, res) => {
  const csvFilePath = "./updated_merged_data.csv";
  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Error reading CSV file");
    } else {
      const parsedData = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
      }).data;
      res.json(parsedData);
    }
  });
};

export default getData;
