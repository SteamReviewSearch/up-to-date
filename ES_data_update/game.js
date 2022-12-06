const client = require("../ELK_connection");
const Worker = require("worker_threads");
var _ = require("lodash");
const https = require("https");
const { Op } = require("sequelize");
const { Games, Reviews, Metascores } = require("../models");

//-- SELECT * FROM `steam_datas`.`Reviews` Order by appid asc LIMIT 1000;
// SELECT DATE_FORMAT(createdAt, '%Y%m%d') AS date, count(*) AS cnt
// FROM `steam_datas`.`Reviews`
// GROUP BY DATE_FORMAT(createdAt, '%Y%m%d') ORDER BY date DESC;
const axios = require("axios");
const { response } = require("express");
//데이터베이스 접속 변수
//작동코드
function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
async function work(n, index) {
  //반복문을 동기처리 및 실패시 재접속을 위한 함수화
  //n:appid
  console.log("index : " + index + "/ appid " + n);
  await setTimeoutPromise(5000);
  await axios
    .get(
      `https://store.steampowered.com/api/appdetails?appids=${n}&l=korean`,
      {
        contentType: "utf-8",
      },
      {
        baseURL: `https://store.steampowered.com/`,
        timeout: 60000, //아웃바운드 문제 - 포트복제등이 timeout으로 쌓이다보니까 나중에 요청을 보내지를 못함.
        httpsAgent: new https.Agent({ keepAlive: true }),
        headers: { "Content-Type": "application/xml" },
      }
    )
    .then(async (response) => {
      // null값은 위에서 잡힘
      // 반환값이 null도 아니고 string '' 인 경우가 있음
      if (response.data !== "" || null) {
        const res = response.data;
        // console.log(res)
        if (res[n].success && res[n].img_url && res[n].short_description) {
          const { exist } = await check(n);
          if (!exist) {
            // url만 뽑아서 Games에 저장
            await client.create({
              index: "games_data",
              id: id, //이거 뭔뜻?
              body: {
                doc: {
                  genre: res[n].genre,
                  review_score: res[n].review_score,
                  name: res[n].name,
                  genreid: res[n].genreid,
                  version: res[n].version,
                  total_positive: res[n].total_positive,
                  img_url: res[n].img_url,
                  review_score_desc: res[n].review_score_desc,
                  total_positive: res[n].total_positive,
                  appid: res[n].appid,
                  timestamp: res[n].timestamp,
                  short_description: res[n].short_description,
                  supported_language: res[n].supported_language,
                  categories: res[n].categories,
                  type: res[n].type,
                  short_description_eng: res[n].short_description_eng,
                  genres: res[n].genres,
                  release_date: res[n].data.release_date,
                  platforms: res[n].data.platforms,
                },
              },
            });
          } else {
            await client.update({
              index: "games_data",
              id: id, //이거 뭔뜻?
              body: {
                doc: {
                  genre: res[n].genre,
                  review_score: res[n].review_score,
                  name: res[n].name,
                  genreid: res[n].genreid,
                  version: res[n].version,
                  total_positive: res[n].total_positive,
                  img_url: res[n].img_url,
                  review_score_desc: res[n].review_score_desc,
                  total_positive: res[n].total_positive,
                  appid: res[n].appid,
                  timestamp: res[n].timestamp,
                  short_description: res[n].short_description,
                  supported_language: res[n].supported_language,
                  categories: res[n].categories,
                  type: res[n].type,
                  short_description_eng: res[n].short_description_eng,
                  genres: res[n].genres,
                  release_date: res[n].data.release_date,
                  platforms: res[n].data.platforms,
                },
              },
            });
          }
        } else {
          const { exist } = await check(n);
          if (exist == true) {
            await client.update({
              index: "games_data",
              id: id,
              body: {
                doc: {
                  appid: res[n].appid,
                  pass: false,
                },
              },
            });
          } else {
            await client.create({
              index: "games_data",
              id: id,
              body: {
                doc: {
                  appid: res[n].appid,
                  pass: false,
                },
              },
            });
          }
        }
      }
    })
    .catch(async (error) => {
      console.log("멈춤 => " + error);
      await setTimeoutPromise(100000);
      await work(n, index);
    });
}

test = async () => {
  let num = Worker.threadId;
  let start = 0;
  await finAllList(num, start);
  let list = await response();
  //game테이블에서 리스트 구합니다.
  //배열을 2개씩 나눕니다.
  let index = 0;
  for (const i of list) {
    //두개씩있는 배열 반복
    let n = i.appid;
    index++;
    const result = await work(n, index);
    // console.log(result)
    if (result) await setTimeoutPromise(1000);
  }
};
let finAllList = async (offset, start) => {
  //게임 리스트
  let res = request(
    "Get",
    "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;
      let list = [];
      for (
        let i = (offset - 1) * 50000 + start;
        i < (offset - 1) * 50000 + start + 50000;
        i++
      ) {
        list.push(apps[i].appid);
      }
      return list;
    } else {
      console.log(res.body.slice(0, 6) + i);
    }
  }
};

let check = async (appid) => {
  const list = await client.search({
    index: "review_data",
    body: {
      query: {
        bool: {
          must: [{ exists: { appid: "appid" } }],
        },
      },
    },
  });
  if (list.hits.total["value"]) {
    return true;
  } else {
    console.log("통과");
    return false;
  }
};

test();

// let t =async()=>{
//   let i =await existReview(1457540,'76561198040580543',1624621783);
//   console.log(i)
// }
// t();
//실행

let findWithES = async () => {
  try {
    const list = await client.search({
      index: "games",
      body: {
        query: {
          bool: {
            must: [
              { match: { name: "call of duty " } },
              { exists: { field: "review_score_desc" } },
            ],
          },
        },
      },
    });
    console.log(list);
    return;
  } catch (error) {
    throw error;
  }
};
