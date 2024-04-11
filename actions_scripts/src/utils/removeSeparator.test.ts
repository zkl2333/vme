import { removeSeparator } from "./removeSeparator";

describe("removeSeparator", () => {
  // 测试纯汉字字符串
  it("should return the original string if it only contains Chinese characters", () => {
    expect(removeSeparator("测试汉字")).toBe("测试汉字");
  });

  // 测试纯字母字符串
  it("should return the original string if it only contains alphabetic characters", () => {
    expect(removeSeparator("TestABC")).toBe("TestABC");
  });

  // 测试纯数字字符串
  it("should return the original string if it only contains digits", () => {
    expect(removeSeparator("123456")).toBe("123456");
  });

  // 测试混合字符串
  it("should remove non-alphanumeric characters from a mixed string", () => {
    expect(removeSeparator("测试ABC123!@#")).toBe("测试ABC123");
  });

  // 测试空字符串
  it("should return an empty string if the input is empty", () => {
    expect(removeSeparator("")).toBe("");
  });

  // 测试全角和半角标点符号
  it("should remove both full-width and half-width punctuation", () => {
    expect(removeSeparator("，。！？;:、“”（）《》ABC123")).toBe("ABC123");
  });

  // 测试特殊字符
  it("should remove special characters", () => {
    expect(removeSeparator("测试^&*()_+=-[]{}|;:,.<>?`~ABC123")).toBe("测试ABC123");
  });
});
