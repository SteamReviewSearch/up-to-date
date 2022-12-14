const client = require("../ELK_connection")
var request = require("sync-request");
const Detail = require('./game')

let detail = new Detail

function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}


let updateNameEng = async () => {

  // 리스트 불러오기
  let res = await request(
    "Get", "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;

      let index = -1;
      let count = 0
      // console.log(apps.slice(Math.floor(apps.length / 1000), -1).length)
      // return;
      for (let i = 0; i < Math.ceil(apps.length / 1000); i++) {
        // 100씩 끊기
        // await setTimeoutPromise(1000)
        index++
        let list = i === (Math.ceil(apps.length / 1000) - 1) ? apps.slice(i * 1000, -1) : apps.slice(i * 1000, i * 1000 + 1000);

        // appid만 담기(_search용)
        let appid_list = [];

        for (let j = 0; j < list.length; j++) {
          appid_list.push(list[j].appid)
        }
        // appid 묶음 검색하기 (_id 찾는용도)
        const games = await client.search({
          index: "games_data",
          size: 1000,
          _source: ["appid"],
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    appid: appid_list
                  }
                }
              ]
            }
          }
        })
        let appids = games.hits.hits

        let new_appids = []
        for (let i = 0; i < appids.length; i++) {
          if (!appid_list.includes(appids[i]._source.appid)) {
            new_appids.push(appids[i]._source.appid)
          }
        }

        if (new_appids.length) {

          count += new_appids.length
          // bulk용 request 쿼리 만들어주기
          let req_list = []

          for (let k = 0; k < appids.length; k++) {

            for (let j = 0; j < list.length; j++) {


              if (list[j].appid == appids[k]._source.appid) {

                const body = await detail.work(list[j].appid, list[j].name)
                const index_request = { "index": { "_id": appids[k]._id, "_index": "games_data" } }
                const index_field = { "field": body }
                req_list.push(index_request, index_field)
              }
            }
          }
          // bulk 요청하기
          // 업데이트할게 없음 ㅅㄱ
          const result = await client.bulk({
            body: req_list
          })
          console.log("index: " + index + " / " + "took: " + result.took + " / " + "errors: " + result.errors + ' / ' + 'count: ' + count)
        } else {
          console.log(index + "이상무")
        }
      }
    }
  };
}



updateNameEng()

