const getAction = require("../actions/get");
const sleep = require("./sleep");
const config = require("../config.json");
const addLog = require("./addLog");

async function getGoldenDuckInfo(token, ua) {
  let retry = 0;
  let data = null;
  while (retry < config.retryCount) {
    if (!!data) {
      break;
    }
    data = await getGoldenDuckInfoInternal(token, ua);
    retry++;
  }

  return data;
}

async function getGoldenDuckInfoInternal(token, ua) {
  try {
    const response = await getAction(token, "golden-duck/info", ua);
    return response.data;
  } catch (error) {
    console.log("getGoldenDuckInfo error");
    if (error.response) {
      console.log("status", error.response.status);
      const status = error.response.status;

      addLog(`getGoldenDuckInfoInternal error ${status}`, "error");

      if (status >= 500) {
        console.log("Lỗi kết nối, tự động kết nối sau 5s");
        await sleep(5);
        return null;
      } else if (status === 401) {
        console.log(`\nToken lỗi hoặc hết hạn\n`);
        process.exit(1);
      } else if (status === 400) {
        return error.response.data;
      } else {
        console.log("Lỗi kết nối, tự động kết nối sau 3s");
        await sleep(3);
        return null;
      }
    } else if (error.request) {
      console.log("request", error.request);
      console.log("Lỗi kết nối, tự động kết nối sau 3s");
      await sleep(3);
      return null;
    } else {
      console.log("error", error.message);
      console.log("Lỗi kết nối, tự động kết nối sau 3s");
      await sleep(3);
      return null;
    }
  }
}

module.exports = getGoldenDuckInfo;
