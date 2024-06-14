const getListReload = require("../modules/getListReload");
const collectEgg = require("../modules/collectEgg");
const layEgg = require("../modules/layEgg");
const getGoldenDuckInfo = require("../modules/getGoldenDuckInfo");
const getGoldenDuckReward = require("../modules/getGoldenDuckReward");
const claimGoldenDuck = require("../modules/claimGoldenDuck");
const addLog = require("../modules/addLog");
const getMaxDuck = require("../modules/getMaxDuck");
const collectDuck = require("../modules/collectDuck");
const removeDuck = require("../modules/removeDuck");
const goldenDuckRewardText = require("../modules/goldenDuckRewardText");
const getBalance = require("../modules/getBalance");
const Timer = require("easytimer.js").Timer;
const randomUseragent = require("random-useragent");
const hatchEgg = require("../modules/hatchEgg");
const randomSleep = require("../modules/randomSleep");
const sleep = require("../modules/sleep");

const ua = randomUseragent.getRandom((ua) => {
  return ua.browserName === "Chrome";
});

const ERROR_MESSAGE = "Chụp màn hình lại gửi cho Hoàng Lão Tà fix !";

const RARE_EGG = [
  undefined,
  "Common *",
  "Common **",
  "Rare *",
  "Rare **",
  "Rare ***",
  "Rare ****",
  "Rare *****",
  "Rare ******",
  "Mythic *",
  "Mythic **",
  "Mythic ***",
  "Mythic ****",
  "Eternal",
];

const RARE_DUCK = [undefined, "COMMON", "RARE", "LEGENDARY"];

let accessToken = null;
let run = false;
let timerInstance = new Timer();
let eggs = 0;
let pets = 0;
let goldenDuck = 0;
let timeToGoldenDuck = 0;
let myInterval = null;
let maxDuckSlot = null;
let maxNestSlot = null;
let maxRareEgg = null;
let maxRareDuck = null;
let msg = null;
let wallets = null;
let balancePet = 0;
let balanceEgg = 0;

function showRareDuck(metadata) {
  return [
    RARE_DUCK[metadata.head_rare],
    RARE_DUCK[metadata.arm_rare],
    RARE_DUCK[metadata.body_rare],
  ].join(", ");
}

function getDuckToLay(ducks) {
  const duck = ducks.reduce((prev, curr) =>
    prev.last_active_time < curr.last_active_time ? prev : curr
  );
  return duck;
}

async function collectFromListInternal(token, listNests, listDucks) {
  const randomIndex = Math.floor(Math.random() * listNests.length);
  const nest = listNests[randomIndex];
  const nestStatus = nest.status;
  const duck = getDuckToLay(listDucks);

  if (nestStatus === 2) {
    if (nest.type_egg < maxRareEgg) {
      const collectEggData = await collectEgg(token, ua, nest.id);

      if (collectEggData.error_code !== "") {
        const error_code = collectEggData.error_code;
        console.log("collectEggData error", error_code);

        switch (error_code) {
          case "DUPLICATE_REQUEST":
            await randomSleep();
            collectFromList(token, listNests, listDucks);
            break;

          case "THIS_NEST_DONT_HAVE_EGG_AVAILABLE":
            const layEggData = await layEgg(token, ua, nest.id, duck.id);

            if (layEggData.error_code !== "") {
              const error_code = layEggData.error_code;
              console.log("layEggData 1 error", error_code);
              switch (error_code) {
                case "THIS_DUCK_NOT_ENOUGH_TIME_TO_LAY":
                  await randomSleep();
                  collectFromList(token, listNests, listDucks);
                  break;

                case "THIS_NEST_IS_UNAVAILABLE":
                  await randomSleep();
                  hatchEggGoldenDuck(token);
                  break;

                default:
                  await randomSleep();
                  hatchEggGoldenDuck(token);
                  break;
              }
            } else {
              listNests = listNests.filter((n) => n.id !== nest.id);
              listDucks = listDucks.filter((d) => d.id !== duck.id);

              await randomSleep();
              collectFromList(token, listNests, listDucks);
            }
            break;
          default:
            await randomSleep();
            hatchEggGoldenDuck(token);
            break;
        }
      } else {
        const layEggData = await layEgg(token, ua, nest.id, duck.id);

        if (layEggData.error_code !== "") {
          const error_code = layEggData.error_code;
          console.log("layEggData 2 error", error_code);
          switch (error_code) {
            case "THIS_DUCK_NOT_ENOUGH_TIME_TO_LAY":
              await randomSleep();
              collectFromList(token, listNests, listDucks);
              break;

            case "THIS_NEST_IS_UNAVAILABLE":
              await randomSleep();
              hatchEggGoldenDuck(token);
              break;

            default:
              await randomSleep();
              hatchEggGoldenDuck(token);
              break;
          }
        } else {
          const rareEgg = RARE_EGG[nest.type_egg];
          msg = `Đã thu hoạch [ NEST ${nest.id} ] : [ EGG - ${rareEgg} ]`;
          console.log(msg);

          balanceEgg++;
          eggs++;

          listNests = listNests.filter((n) => n.id !== nest.id);
          listDucks = listDucks.filter((d) => d.id !== duck.id);

          await randomSleep();
          collectFromList(token, listNests, listDucks);
        }
      }
    } else {
      msg = `Đang ấp trứng [ NEST ${nest.id} ] : [ EGG - ${
        RARE_EGG[nest.type_egg]
      } ]`;
      console.log(msg);

      const hatchEggData = await hatchEgg(token, ua, nest.id);

      if (hatchEggData.error_code !== "") {
        const error_code = hatchEggData.error_code;

        switch (error_code) {
          case "REACH_MAX_NUMBER_OF_DUCK":
            const rmDuck = listDucks.reduce((prev, curr) =>
              prev.total_rare < curr.total_rare ? prev : curr
            );

            const removeDuckData = await removeDuck(token, ua, rmDuck.id);

            msg = `FARM [ DUCK ${rmDuck.id} : ${showRareDuck(
              rmDuck.metadata
            )} ] > DELETE`;
            console.log(msg);
            addLog(msg, "farm");

            listDucks = listDucks.filter((d) => d.id !== rmDuck.id);
            collectFromList(token, listNests, listDucks);
            break;

          case "THIS_NEST_DONT_HAVE_EGG_AVAILABLE":
            const layEggData = await layEgg(token, ua, nest.id, duck.id);

            if (layEggData.error_code !== "") {
              const error_code = layEggData.error_code;
              console.log("layEggData 3 error", error_code);
              switch (error_code) {
                case "THIS_DUCK_NOT_ENOUGH_TIME_TO_LAY":
                  await randomSleep();
                  collectFromList(token, listNests, listDucks);
                  break;

                case "THIS_NEST_IS_UNAVAILABLE":
                  await randomSleep();
                  hatchEggGoldenDuck(token);
                  break;

                default:
                  await randomSleep();
                  hatchEggGoldenDuck(token);
                  break;
              }
            } else {
              listNests = listNests.filter((n) => n.id !== nest.id);
              listDucks = listDucks.filter((d) => d.id !== duck.id);

              await randomSleep();
              collectFromList(token, listNests, listDucks);
            }
            break;

          default:
            console.log("hatchEggData error", error_code);
            console.log(ERROR_MESSAGE);
            break;
        }
      } else {
        await sleep(hatchEggData.data.time_remain);
        const collectDuckData = await collectDuck(token, ua, nest.id);

        if (collectDuckData.error_code !== "") {
          console.log("collectDuckData 1 error", collectDuckData.error_code);
          console.log(ERROR_MESSAGE);
        } else {
          let isDeleted = false;

          if (collectDuckData.data.total_rare < maxRareDuck) {
            const removeDuckData = await removeDuck(
              token,
              ua,
              collectDuckData.data.duck_id
            );

            if (removeDuckData.error_code !== "") {
              console.log("removeDuckData", removeDuckData.error_code);
              console.log(ERROR_MESSAGE);
            }

            isDeleted = true;
          } else isDeleted = false;

          msg = `[ NEST ${nest.id} ] : [ EGG ${
            RARE_EGG[nest.type_egg]
          } ] : [ DUCK 🦆 ${collectDuckData.data.duck_id} : ${showRareDuck(
            collectDuckData.data.metadata
          )} ]${isDeleted ? " > DELETE" : ""}`;
          console.log(msg);
          if (!isDeleted) addLog(msg, "farm");

          const layEggData = await layEgg(token, ua, nest.id, duck.id);

          if (layEggData.error_code !== "") {
            const error_code = layEggData.error_code;
            console.log("layEggData 4 error", error_code);
            switch (error_code) {
              case "THIS_DUCK_NOT_ENOUGH_TIME_TO_LAY":
                await randomSleep();
                collectFromList(token, listNests, listDucks);
                break;

              case "THIS_NEST_IS_UNAVAILABLE":
                await randomSleep();
                hatchEggGoldenDuck(token);
                break;

              default:
                await randomSleep();
                hatchEggGoldenDuck(token);
                break;
            }
          } else {
            listNests = listNests.filter((n) => n.id !== nest.id);
            listDucks = listDucks.filter((d) => d.id !== duck.id);

            await randomSleep();
            collectFromList(token, listNests, listDucks);
          }
        }
      }
    }
  } else if (nestStatus === 3) {
    console.log(
      `[ NEST ${nest.id} ] đang ấp trứng > tự động thu hoạch vịt để tiếp tục`
    );
    const collectDuckData = await collectDuck(token, ua, nest.id);

    if (collectDuckData.error_code !== "") {
      console.log("collectDuckData 2 error", collectDuckData.error_code);
      console.log(ERROR_MESSAGE);
    } else {
      const layEggData = await layEgg(token, ua, nest.id, duck.id);

      if (layEggData.error_code !== "") {
        console.log("layEggData 5 error", layEggData.error_code);
      } else {
        listNests = listNests.filter((n) => n.id !== nest.id);
        listDucks = listDucks.filter((d) => d.id !== duck.id);

        await randomSleep();
        collectFromList(token, listNests, listDucks);
      }
    }
  }
}

async function collectFromList(token, listNests, listDucks) {
  if (timeToGoldenDuck <= 0) {
    clearInterval(myInterval);
    myInterval = null;
    hatchEggGoldenDuck(token);
  } else {
    if (listNests.length === 0)
      return console.clear(), hatchEggGoldenDuck(token);

    return collectFromListInternal(token, listNests, listDucks);
  }
}

async function hatchEggGoldenDuck(token) {
  accessToken = token;

  if (!run) {
    wallets = await getBalance(accessToken, ua);
    wallets.forEach((w) => {
      if (w.symbol === "EGG") balanceEgg = Number(w.balance);
      if (w.symbol === "PET") balancePet = Number(w.balance);
    });

    timerInstance.start();
    maxDuckSlot = await getMaxDuck(accessToken, ua);
    maxDuckSlot = maxDuckSlot.data.max_duck;
  }
  console.log("[ GOLDEN DUCK AND HATCH MODE ]");
  console.log();
  console.log(
    `Bạn đang có : [ ${balanceEgg.toFixed(2)} EGG ] [ ${balancePet.toFixed(
      2
    )} PEPET ]`
  );
  console.log();
  console.log(
    `Thời gian chạy : [ ${timerInstance
      .getTimeValues()
      .toString(["days", "hours", "minutes", "seconds"])} ]`
  );
  console.log(
    `Tổng thu hoạch : [ ${eggs.toFixed(2)} EGG ] [ ${pets.toFixed(
      2
    )} PEPET ]`
  );
  console.log();

  if (timeToGoldenDuck <= 0) {
    const getGoldenDuckInfoData = await getGoldenDuckInfo(accessToken, ua);

    if (getGoldenDuckInfoData.error_code !== "") {
      console.log(
        "getGoldenDuckInfoData error",
        getGoldenDuckInfoData.error_code
      );
      console.log(ERROR_MESSAGE);
    } else {
      if (getGoldenDuckInfoData.data.time_to_golden_duck === 0) {
        clearInterval(myInterval);

        console.log("[ GOLDEN DUCK ] : Vịt vàng xuất hiện");
        const getGoldenDuckRewardData = await getGoldenDuckReward(
          accessToken,
          ua
        );

        const { data } = getGoldenDuckRewardData;

        if (data.type === 0) {
          msg = "Chúc bạn may mắn lần sau";
          msg = "";
          console.log(msg);
          addLog(`[ GOLDEN DUCK ] :  ${msg}`, "golden");
        } else if (data.type === 1 || data.type === 4) {
          msg = goldenDuckRewardText(data);
          console.log(` "[ GOLDEN DUCK ] : ${msg}`);
          addLog(msg, "golden");
        } else {
          const claimGoldenDuckData = await claimGoldenDuck(accessToken, ua);

          goldenDuck++;

          if (data.type === 2) {
            pets += Number(data.amount);
            balancePet += Number(data.amount);
          }
          if (data.type === 3) {
            eggs += Number(data.amount);
            balanceEgg += Number(data.amount);
          }

          msg = goldenDuckRewardText(data);
          console.log(`[ GOLDEN DUCK ] : ${msg}`);
          addLog(msg, "golden");
        }
      } else {
        timeToGoldenDuck = getGoldenDuckInfoData.data.time_to_golden_duck;

        myInterval = setInterval(() => {
          timeToGoldenDuck--;
        }, 1e3);
      }
    }
  }

  msg = `[ GOLDEN DUCK ] : [ ${goldenDuck} ] | ${timeToGoldenDuck}s nữa gặp`;
  console.log(msg);

  const { listNests, listDucks } = await getListReload(
    accessToken,
    ua,
    run ? false : true
  );

  if (!run) {
    maxNestSlot = listNests.length;

    switch (maxNestSlot) {
      case 3:
        maxRareEgg = 4;
        break;
      case 4:
        maxRareEgg = 6;
        break;
      case 5:
        maxRareEgg = 8;
        break;
      case 6:
        maxRareEgg = 10;
        break;
      case 7:
        maxRareEgg = 12;
        break;
      case 8:
        maxRareEgg = 13;
        break;
      case 9:
        maxRareEgg = 13;
        break;
    }

    const duck = listDucks.reduce((prev, curr) =>
      prev.total_rare > curr.total_rare ? prev : curr
    );
    maxRareDuck = duck.total_rare;
  }

  run = true;
  const nestIds = listNests.map((i) => i.id);
  console.log(`[ ${listNests.length} NEST ] : [ ${nestIds.join(", ")} ]`);
  console.log();
  collectFromList(accessToken, listNests, listDucks);
}

module.exports = hatchEggGoldenDuck;
