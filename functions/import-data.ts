import cloud from "@lafjs/cloud";
const db = cloud.mongo.db;

export default async function (ctx: FunctionContext) {
  const res = await fetch(
    "https://raw.githubusercontent.com/whitescent/KFC-Crazy-Thursday/main/kfc.json"
  );

  const data = await res.json();

  if (Array.isArray(data)) {
    console.log("导入数据:", data.length);

    const currentTime = new Date(); // 获取当前时间

    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { text: item.text },
        update: {
          $setOnInsert: { text: item.text, createdAt: currentTime },
          $set: { updatedAt: currentTime },
        },
        upsert: true, // 不存在时插入
      },
    }));

    const collection = db.collection("kfc");
    const ret = await collection.bulkWrite(bulkOps, { ordered: false });

    return ret;
  } else {
    console.error("数据格式错误");
  }
}
