const client = require("../ELK_connection")
var request = require("sync-request");
const Detail = require('./game')
const NewGame = require('./update_new_game')
const Worker = require("worker_threads");
const { updateErrorESLog } = require("../Log/logger");

const detail = new Detail();
const newGame = new NewGame()
let gogo = async () => {
  let num = Worker.threadId;
  // 나 === 0 | 민재님 === 6666 | 성영님 === 13332, 19998, 26,664 33330 설정 후 node start.
  // 스레드 15개, 스레드당 10000개씩 3명의 컴퓨터가 3분할하여 크롤링. 이론상 15시간이면 크롤링 완료 
  let start = 0;
  let { list, start_point } = await finAllList(num, start);
  if (!list) {
    console.log(num, "번 끝!!!")
    return;
  }

  // release_date.comming_soon: true 인 게임 체크 -> 업데이트 정보 저장 
  await updateAll(list, start_point)
  // 신규게임 리스트 체킹 -> 체크된 게임정보 저장
  await newGame.createNewGame()
};


let finAllList = async (offset, start) => {
  //게임 리스트
  await detail.setTimeoutPromise((offset - 1) * 30000) // 30초에 하나씩 시작
  let res = await request(
    "Get",
    "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;
      let start_point = ((offset - 1) * 20000) + start
      const log = `
      ===================================================================
        ${offset}-Worker START!! | 시작: ${start_point} | ${offset < 10 ? "30초 뒤 다음 worker 시작" : "Worker threads 시작 완료"} 
      ===================================================================
            `

      // 마지막 스레드 분기처리
      if (offset === 8) {
        if (start_point < apps.length) {
          if (start_point + 20000 > apps.length) {
            console.log(log)
            return { list: apps.slice(start_point, -1), start_point };
          } else {
            console.log(log)
            return { list: apps.slice(start_point, start_point + 20000), start_point };
          }
        }

        console.log(`${offset} - 이번 스레드가 필요가 없음 Worker threads 시작 완료`)
        return { list: false, start_point };
      }

      const list = apps.slice(start_point, start_point + 20000)

      console.log(log)
      return { list, start_point };
    } else {
      console.log(res.body.slice(0, 6) + i);
    }
  }
};

let updateAll = async (apps, start_point) => {

  let index = start_point - 1;
  let count = 0
  for (let i = 0; i < Math.ceil(apps.length / 100); i++) {
    // 100씩 끊기

    await setTimeoutPromise(500)
    index += 100
    let list = i === (Math.ceil(apps.length / 100) - 1) ? apps.slice(i * 100, -1) : apps.slice(i * 100, i * 100 + 100);

    // appid만 담기(_search용)
    let appid_list = [];

    for (let j = 0; j < list.length; j++) {
      appid_list.push(list[j].appid)
    }
    // appid 묶음 검색하기 (_id 찾는용도)
    const games = await client.search({
      index: "games_data",
      size: 100,
      _source: ["appid"],
      query: {
        bool: {
          filter: [
            {
              terms: {
                appid: appid_list
              }
            },
            {
              match: {
                "release_date.coming_soon": true
              }
            }
          ]
        }
      }
    })
    count += games.hits.hits.length
    // bulk용 request 쿼리 만들어주기
    let req_list = []

    for (let k = 0; k < games.hits.hits.length; k++) {

      for (let j = 0; j < list.length; j++) {

        if (list[j].appid == games.hits.hits[k]._source.appid) {

          const { body } = await detail.work(list[j].appid, list[j].name)
          await detail.setTimeoutPromise(12000)
          const update_request = { "update": { "_id": games.hits.hits[k]._id, "_index": "games_data" } }
          const update_doc = { "doc": body }
          req_list.push(update_request, update_doc)
        }
      }
    }
    // bulk 요청하기

    // console.log(req_list)
    if (!req_list.length) continue

    const result = await client.bulk({
      body: req_list
    })
    if (result.errors) {
      console.log(result.items.map(x => x.update.error))
      updateErrorESLog.error({ label: "게임크롤링", message: result.items.map(x => x.update.error) || 'null' })
    }
    console.log("index: " + index + " / " + "took: " + result.took + " / " + "errors: " + result.errors + ' / ' + 'count: ' + count)
  }
};

function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
// updateAll()
gogo()