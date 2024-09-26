import { NextRequest, NextResponse } from "next/server";
import { getRandomKfcItem } from "./_utils";

export async function GET(request: NextRequest) {
  // 处理跨域请求
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  try {
    const data = await getRandomKfcItem();

    if (format === "json") {
      return NextResponse.json(data, { headers });
    } else if (format === "text") {
      return new NextResponse(data.body, { headers });
    } else {
      // 默认返回 JSON 格式
      return NextResponse.json(data, { headers });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers }
    );
  }
}

export function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new NextResponse(null, { status: 200, headers });
}
