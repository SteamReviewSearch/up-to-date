const client = require("../ELK_connection")
var request = require("sync-request");
const Detail = require('./game')
const Worker = require("worker_threads");

const detail = new Detail();



let updateAll = async (offset, start) => {
  let res = await request(
    "Get", "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;

      let index = -1;
      let count = 0
      for (let i = 0; i < Math.ceil(apps.length / 100); i++) {
        // 100씩 끊기

        await setTimeoutPromise(500)
        index++
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

              const body = await detail.work(list[j].appid, list[j].name)
              await detail.setTimeoutPromise(6000)
              const update_request = { "update": { "_id": games.hits.hits[k]._id, "_index": "games_data" } }
              const update_doc = { "doc": body }
              req_list.push(update_request, update_doc)
            }
          }
        }
        // bulk 요청하기

        console.log(req_list)
        const result = await client.bulk({
          body: req_list
        })
        console.log("index: " + index + " / " + "took: " + result.took + " / " + "errors: " + result.errors + ' / ' + 'count: ' + count)
      }
    }
  };
}
function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
updateAll()