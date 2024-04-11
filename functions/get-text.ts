import { getRandomKfcItem } from "@/utils";

export default async function (ctx: FunctionContext) {
  const item = await getRandomKfcItem();
  return item.body;
}
