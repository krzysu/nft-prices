import fs from "fs";

export const saveToFile = (data: {}, fileName: string) => {
  const dataString = JSON.stringify(data);

  fs.writeFileSync(fileName, dataString);
  console.log(`Data saved to ${fileName}`);
};
