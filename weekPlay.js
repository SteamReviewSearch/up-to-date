const mainThread = require("./new_game/index_game");
const redisGameName = require("./redis_update/redis.js");
const redisAppid = require("./redis_update/redis_appid.js");
function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
const schedule = async () => {
  let plan = new Date().toISOString();
  do {
    const now = new Date();
    let year = now.getFullYear(); // 년
    let month = now.getMonth(); // 월
    let day = now.getDate(); // 일
    let hours = now.getHours(); // 시
    let minutes = now.getMinutes(); // 분
    let seconds = now.getSeconds(); // 초
    let today = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds
    ).toISOString();
    if (today >= plan) {
      plan = new Date(year, month, day + 7).toISOString();
      await new mainThread().index_game();
      await new redisGameName().redisA();
      await new redisAppid().redisB();
    }
    console.log("now: ", today);
    await setTimeoutPromise(360000);
  } while (1);
};
schedule();
