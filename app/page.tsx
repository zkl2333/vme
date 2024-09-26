"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [text, setText] = useState("加载中...");

  const fetchText = async () => {
    try {
      const response = await fetch("/api?format=json");
      const data = await response.json();
      setText(data.body);
    } catch (error) {
      console.error("获取文案时出错:", error);
      setText("获取文案失败，请稍后重试。");
    }
  };

  useEffect(() => {
    fetchText();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6">
        <p className="text-lg text-gray-800 whitespace-pre-wrap mb-4">{text}</p>
        <button
          onClick={fetchText}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          刷新文案
        </button>
      </div>
    </div>
  );
}
