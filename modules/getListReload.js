const getAction = require("../actions/get");
const config = require("../config.json");
const addLog = require("./addLog");
const sleep = require("./sleep");

let isErrorOccured = false;
let maxNest = config.nest;

if (maxNest < 3) maxNest = 3;
if (maxNest > 9) maxNest = 9;

async function getListReload(token, ua, new_game = false) {
  let retry = 0;
  let data = null;
  while (retry < config.retryCount) {
    if (!!data) {
      break;
    }
    data = await getListReloadInternal(
      token,
      ua,
      isErrorOccured ? true : new_game
    );
    retry++;
  }

  return data;
}

async function getListReloadInternal(token, ua, new_game) {
  try {
    let listNests = [];
    let listDucks = [];

    let data = await getListReloadInternalCallAPI(token, ua, new_game);
    isErrorOccured = false;

    data.data.nest.forEach((n) => {
      if (n.type_egg) listNests.push(n);
    });

    if (listNests.length < maxNest) {
      data = await getListReloadInternalCallAPI(token, ua, true);
    }

    isErrorOccured = false;
    listDucks = data.data.duck;

    return { listNests, listDucks };
  } catch (error) {
    console.log("getListReload error");
    if (error.response) {
      console.log("status", error.response.status);
      const status = error.response.status;

      addLog(`getListReload error ${status}`, "error");

      if (status >= 500) {
        console.log("Lỗi kết nối, tự động kết nối sau 5s");
        await sleep(5);
        isErrorOccured = true;
        return null;
      } else if (status === 401) {
        console.log(`\nToken lỗi hoặc hết hạn\n`);
        process.exit(1);
      } else if (status === 400) {
        console.log("data", error.response.data);
        console.log("Lỗi kết nối, tự động kết nối sau 3s");
        await sleep(3);
        isErrorOccured = true;
        return null;
      } else {
        console.log("Lỗi kết nối, tự động kết nối sau 3s");
        await sleep(3);
        isErrorOccured = true;
        return null;
      }
    } else if (error.request) {
      console.log("request", error.request);
      console.log("Lỗi kết nối, tự động kết nối sau 5s");
      await sleep(5);
      return null;
    } else {
      console.log("error", error.message);
      console.log("Lỗi kết nối, tự động kết nối sau 5s");
      await sleep(5);
      return null;
    }
  }
}

async function getListReloadInternalCallAPI(token, ua, new_game = false) {
  const endpoint = new_game ? "nest/list" : "nest/list-reload";
  const { data } = await getAction(token, endpoint, ua);
  return data;
}

module.exports = getListReload;
