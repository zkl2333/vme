import cloud from "@lafjs/cloud";
const db = cloud.mongo.db;

export default async function () {
  console.log("开始导入数据");
  const res = await fetch("https://raw.githubusercontent.com/zkl2333/vme/main/data.json");

  const data = await res.json();

  if (Array.isArray(data)) {
    console.log("读取到数据数据:", data.length);

    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { url: item.url }, // 使用 item.url 作为唯一标识符
        update: { $set: item }, // 使用 $set 操作符更新文档
        upsert: true, // 如果不存在则插入新文档
      },
    }));

    const collection = db.collection("kfc");
    const ret = await collection.bulkWrite(bulkOps, { ordered: false });

    console.log("匹配的文档数量 :", ret.matchedCount);
    console.log("插入的文档数量:", ret.insertedCount);
    console.log("删除的文档数量:", ret.deletedCount);
    console.log("修改的文档数量:", ret.modifiedCount);
    console.log("插入或修改的文档数量:", ret.upsertedCount);
    console.log("插入的新文档ID:", ret.insertedIds);
    console.log("导入数据完成\n");

    return ret;
  } else {
    console.error("数据格式错误");
  }
  console.log("导入数据完成\n");
}
