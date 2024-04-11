import nock from "nock";
import { moderateIssue } from "./moderateIssue";
import { addCommentToIssue, addLabelsToIssue, closeIssue, findSimilarIssue } from "./utils";

jest.mock("@actions/core", () => ({
  setFailed: jest.fn(),
}));
jest.mock("@actions/github");
jest.mock("./utils", () => ({
  addCommentToIssue: jest.fn(),
  addLabelsToIssue: jest.fn(),
  closeIssue: jest.fn(),
  findSimilarIssue: jest.fn(),
  dispatchWorkflow: jest.fn(),
}));
jest.mock("@actions/github", () => ({
  context: {
    issue: {
      number: 1,
    },
  },
}));

// 使用类型断言
const mockedFindSimilarIssue = findSimilarIssue as jest.MockedFunction<typeof findSimilarIssue>;

nock.emitter.on("no match", (req) => {
  console.log("No match for request", req);
});

describe("moderateIssue", () => {
  beforeEach(() => {
    process.env.ISSUE_BODY = "这是一个测试的issue内容";
    process.env.AI_API_KEY = "test-api-key";
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
    delete process.env.ISSUE_BODY;
    delete process.env.AI_API_KEY;
  });

  it("当重复提交时，应该添加重复标签并关闭 issue", async () => {
    const similarIssue = {
      title: "测试标题",
      body: "这是一个测试的issue内容",
      url: "https://github.com/owner/repo/issues/2",
    };

    mockedFindSimilarIssue.mockResolvedValueOnce(similarIssue);

    await moderateIssue();

    expect(addLabelsToIssue).toHaveBeenCalledWith(1, ["重复"]);
    expect(addCommentToIssue).toHaveBeenCalledWith(1, expect.stringContaining("相似"));
    expect(closeIssue).toHaveBeenCalledWith(1);
  });

  it("当内容被标记时，应该添加违规标签并关闭 issue", async () => {
    mockedFindSimilarIssue.mockResolvedValueOnce(null);
    nock("https://api.aiproxy.io")
      .post("/v1/moderations")
      .reply(200, {
        results: [
          {
            categories: {
              hate: false,
              sexual: false,
              violence: true,
              "hate/threatening": false,
              "self-harm": false,
              "sexual/minors": false,
              "violence/graphic": false,
            },
            flagged: true,
            category_scores: null,
          },
        ],
      });

    await moderateIssue();

    expect(addLabelsToIssue).toHaveBeenCalledWith(1, ["违规"]);
    expect(addCommentToIssue).toHaveBeenCalledWith(1, expect.stringContaining("不予收录"));
    expect(closeIssue).toHaveBeenCalledWith(1);
  });

  it("当内容被标记并且没有准确的分类时，应该添加待审标签", async () => {
    mockedFindSimilarIssue.mockResolvedValueOnce(null);
    nock("https://api.aiproxy.io")
      .post("/v1/moderations")
      .reply(200, {
        results: [
          {
            categories: {
              hate: false,
              sexual: false,
              violence: false,
              "hate/threatening": false,
              "self-harm": false,
              "sexual/minors": false,
              "violence/graphic": false,
            },
            flagged: true,
            category_scores: null,
          },
        ],
      });

    await moderateIssue();

    expect(addLabelsToIssue).toHaveBeenCalledWith(1, ["待审"]);
    expect(addCommentToIssue).toHaveBeenCalledWith(1, expect.stringContaining("审核"));
  });

  it("当内容未被标记时，应该添加收录标签并关闭 issue", async () => {
    mockedFindSimilarIssue.mockResolvedValueOnce(null);
    nock("https://api.aiproxy.io")
      .post("/v1/moderations")
      .reply(200, {
        results: [
          {
            categories: {
              hate: false,
              sexual: false,
              violence: false,
              "hate/threatening": false,
              "self-harm": false,
              "sexual/minors": false,
              "violence/graphic": false,
            },
            flagged: false,
            category_scores: null,
          },
        ],
      });

    await moderateIssue();

    expect(addLabelsToIssue).toHaveBeenCalledWith(1, ["收录"]);
    expect(closeIssue).toHaveBeenCalledWith(1);
  });

  it("当接口返回错误时，应该抛出错误", async () => {
    mockedFindSimilarIssue.mockResolvedValueOnce(null);
    nock("https://api.aiproxy.io")
      .post("/v1/moderations")
      .reply(200, {
        error: {
          message: "接口错误",
        },
      });

    await expect(moderateIssue()).rejects.toThrow("接口错误");
  });
});
