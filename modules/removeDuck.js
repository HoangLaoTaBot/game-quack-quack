const postAction = require("../actions/post");
const sleep = require("./sleep");
const config = require("../config.json");
const addLog = require("./addLog");

async function removeDuck(token, ua, duck_id) {
  let retry = 0;
  let data = null;
  while (retry < config.retryCount) {
    if (!!data) {
      break;
    }
    data = await removeDuckInternal(token, ua, duck_id);
    retry++;
  }

  return data;
}

async function removeDuckInternal(token, ua, duck_id) {
  try {
    const data = `ducks=%7B%22ducks%22%3A%5B${duck_id}%5D%7D`;
    const response = await postAction(token, "duck/remove", data, ua);
    return response.data;
  } catch (error) {
    console.log("removeDuck error");
    if (error.response) {
      console.log("status", error.response.status);
      const status = error.response.status;

      addLog(`layEggInternal error ${status}`, "error");

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

module.exports = removeDuck;
