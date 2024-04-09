import cloud from "@lafjs/cloud";
const db = cloud.mongo.db;

export async function getKFC() {
  // const res = await fetch("https://kfc-crazy-thursday.vercel.app/api/index");
  // const data = await res.text();
  // return data;

  return getRandomKfcItem();
}

export async function getRandomKfcItem() {
  const collection = db.collection("kfc");

  // 使用聚合管道中的 $sample 阶段随机选择一条记录
  const aggregatePipeline = [
    { $sample: { size: 1 } }, // 随机选择一条记录
  ];

  // 执行聚合查询
  const result = await collection.aggregate(aggregatePipeline).toArray();

  // 检查是否有结果返回，并处理结果
  if (result.length > 0) {
    return result[0]; // 返回随机选择的记录
  } else {
    return { error: "没有找到任何记录" }; // 如果没有找到记录，返回错误信息
  }
}
