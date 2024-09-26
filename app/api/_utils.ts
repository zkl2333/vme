import fs from "fs";
import path from "path";

interface KfcItem {
  title: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    avatarUrl: string;
    url: string;
  };
}

export async function getRandomKfcItem(): Promise<KfcItem> {
  const pathToFile = path.resolve(process.cwd(), "data.json");
  const data = await fs.promises.readFile(pathToFile, "utf-8");
  const items = JSON.parse(data);
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}
