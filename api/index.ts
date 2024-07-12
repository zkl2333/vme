import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRandomKfcItem } from "./_utils";

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  // 处理跨域请求
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS" || request.method === "HEAD") {
    return response.status(200).end();
  }

  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { format } = request.query;
    const data = await getRandomKfcItem();

    if (format === "json") {
      return response.status(200).json(data);
    } else if (format === "text") {
      return response.status(200).send(data.body);
    } else {
      // 默认返回 JSON 格式
      return response.status(200).json(data);
    }
  } catch (error) {
    return response.status(500).json({ error: "Internal Server Error" });
  }
}
