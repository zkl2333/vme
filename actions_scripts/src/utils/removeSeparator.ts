// 去除字符串中的全角和半角分隔符、中文标点以及特定的特殊字符

export function removeSeparator(str: string): string {
  // 半角标点和空格
  const halfWidthPunctuations = "\\x20,!@#.;:";
  // 全角标点和空格
  const fullWidthPunctuations = "\u3000\uFF0C\u3002\uFF1B\uFF1A";
  // 中文标点
  const chinesePunctuations =
    "\u3001\u201C\u201D\u2018\u2019\uFF08\uFF09\u3010\u3011\u300A\u300B\uFF01\uFF1F\u2014\uFF5E";
  // 特殊字符，注意需要转义的部分
  const specialCharacters = "\\^&*()_+=\\-\\[\\]{}|<>?`~";

  // 组合正则表达式
  const regex = new RegExp(
    `[${halfWidthPunctuations}${fullWidthPunctuations}${chinesePunctuations}${specialCharacters}]`,
    "g"
  );

  // 使用正则表达式的replace方法替换掉这些分隔符、中文标点和特殊字符
  return str.replace(regex, "");
}
