const client = require("../ELK_connection");
const Worker = require("worker_threads");
var _ = require("lodash");
const https = require("https");
var request = require("sync-request");
const { Op } = require("sequelize");
const { Games, Reviews, Metascores } = require("../models");

//-- SELECT * FROM `steam_datas`.`Reviews` Order by appid asc LIMIT 1000;
// SELECT DATE_FORMAT(createdAt, '%Y%m%d') AS date, count(*) AS cnt
// FROM `steam_datas`.`Reviews`
// GROUP BY DATE_FORMAT(createdAt, '%Y%m%d') ORDER BY date DESC;
const axios = require("axios");
const { response } = require("express");
const { nextTick } = require("process");
const { type } = require("os");
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
  await setTimeoutPromise(15000);
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
      // try {
      // null값은 위에서 잡힘
      // 반환값이 null도 아니고 string '' 인 경우가 있음
      if (response.data !== "" || null || undefined) {
        const res = response.data;
        // console.log(res)
        if (
          res[n].success &&
          res[n].data.img_url !== null &&
          res[n].data.short_description !== null
        ) {
          const result = res[n].data;
          const exist = await check(n);
          if (!exist) {
            // url만 뽑아서 Games에 저장
            await client.index({
              index: "t_gamedata",
              id: n,
              refresh: true,
              body: {
                params: { retry_on_conflict: 6 },
                doc: {
                  genre: result.genre,
                  review_score: result.review_score,
                  name: result.name,
                  genreid: result.genreid,
                  total_positive: result.total_positive,
                  img_url: result.img_url,
                  review_score_desc: result.review_score_desc,
                  total_positive: result.total_positive,
                  appid: n,
                  short_description: result.short_description,
                  supported_language: result.supported_language,
                  categories: result.categories,
                  type: result.type,
                  short_description_eng: result.short_description_eng,
                  genres: result.genres,
                  release_date: result.release_date,
                  platforms: result.platforms,
                },
              },
            });
            console.log("================================", n);
          } else {
            await client.update({
              index: "t_gamedata",
              refresh: true,
              id: exist, //이거 뭔뜻?
              body: {
                params: { retry_on_conflict: 6 },
                doc: {
                  review_score: result.review_score,
                  name: result.name,
                  version: result.version,
                  total_positive: result.total_positive,
                  img_url: result.img_url,
                  review_score_desc: result.review_score_desc,
                  total_positive: result.total_positive,
                  appid: result.appid,
                  timestamp: result.timestamp,
                  short_description: result.short_description,
                  supported_language: result.supported_language,
                  categories: result.categories,
                  type: result.type,
                  short_description_eng: result.short_description_eng,
                  genres: result.genres,
                  release_date: result.release_date,
                  platforms: result.platforms,
                  price_overview: result.price_overview,
                },
              },
            });
          }
        } else {
          const { exist } = await check(n);
          if (exist) {
            await client.update({
              index: "t_gamedata",
              refresh: true,
              id: exist,
              body: {
                params: { retry_on_conflict: 6 },
                doc: {
                  appid: n,
                  pass: false,
                },
              },
            });
          } else {
            await client.index({
              index: "t_gamedata",
              refresh: true,
              id: n,
              body: {
                params: { retry_on_conflict: 6 },
                doc: {
                  appid: n,
                  pass: false,
                },
              },
            });
          }
        }
      }
      // } catch (error) {
      //   next(error);
      // }
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
  let list = await finAllList(num, start);
  //game테이블에서 리스트 구합니다.
  //배열을 2개씩 나눕니다.
  let index = 0;
  for (const i of list) {
    //두개씩있는 배열 반복
    let n = i;
    index++;
    const result = await work(n, index);
    // console.log(result)
    if (result) await setTimeoutPromise(1000);
  }
};
let finAllList = async (offset, start) => {
  //게임 리스트
  let res = await request(
    "Get",
    "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;
      // console.log(apps);
      let list = [];
      for (
        let i = (offset - 1) * 50000 + start;
        i < (offset - 1) * 50000 + start + 50000;
        i++ //최대치를 넘어가지 못하게 수정
      ) {
        if (apps[i]) {
          list.push(apps[i].appid);
        }
      }
      return list;
    } else {
      console.log(res.body.slice(0, 6) + i);
    }
  }
};

let check = async (appid) => {
  const list = await client.search({
    index: "t_gamedata",
    body: {
      query: {
        bool: {
          must: [{ match: { appid: appid } }],
        },
      },
    },
  });
  if (list.hits.hits.length) {
    console.log("!통과", list.hits.hits[0]._source.appid);
    return list.hits.hits[0]._source.appid;
  } else {
    console.log("통과", appid);
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
