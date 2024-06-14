const TOKEN_FILE_PATH = "./token.json";
const fs = require("fs");

const ERROR_MESSAGE =
  "\nLỗi định dạng Token, vui lòng paste Token vào file token.json\n";

function loadUserLoginInfo() {
  let content = "";
  try {
    content = fs.readFileSync(TOKEN_FILE_PATH, "utf8");
  } catch {
    fs.writeFileSync(TOKEN_FILE_PATH, "");
  }

  try {
    return JSON.parse(content);
  } catch {
    console.error(ERROR_MESSAGE);
    process.exit(1);
  }
}

function loadToken() {
  const TELEGRAM_USER = loadUserLoginInfo();
  const ACCESS_TOKEN = TELEGRAM_USER?.state?.token;
  if (!ACCESS_TOKEN) {
    console.error(ERROR_MESSAGE);
    process.exit(1);
  }
  return ACCESS_TOKEN;
}

module.exports = loadToken;
