import { getRandomKfcItem } from "@/utils";

export default async function (ctx: FunctionContext) {
  return getRandomKfcItem();
}
