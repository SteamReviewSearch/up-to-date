const Worker = require("worker_threads");
var _ = require("lodash");
const https = require("https");
//-- SELECT * FROM `steam_datas`.`Reviews` Order by appid asc LIMIT 1000;
// SELECT DATE_FORMAT(createdAt, '%Y%m%d') AS date, count(*) AS cnt
// FROM `steam_datas`.`Reviews`
// GROUP BY DATE_FORMAT(createdAt, '%Y%m%d') ORDER BY date DESC;
const axios = require("axios");

const { Reviews, Games } = require("./models");
//데이터베이스 접속 변수
//작동코드
function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
async function work(n, index) {
  //반복문을 동기처리 및 실패시 재접속을 위한 함수화
  console.log("index : " + index);
  //n:appid
  await setTimeoutPromise(1000);
  await axios
    .get(
      `http://store.steampowered.com/appreviews/${n}?json=1&l=english&filter=recent&num_per_page=100`,
      {
        contentType: "utf-8",
        // method: "GET",
        // uri: uri,
      },
      {
        baseURL: `http://store.steampowered.com/appreviews/${n}?json=1&l=english&filter=recent&num_per_page=100`,
        timeout: 60000, //optional
        httpsAgent: new https.Agent({ keepAlive: true }),
        headers: { "Content-Type": "application/xml" },
      }
    )
    .then(async (response) => {
      if (response !== undefined) {
        if (!response?.body?.slice(0, 6).includes("<")) {
          //access deined발생시 axios에러를 뱉어서 여기까지 안옴
          //response.body는 undefind로 나옴
          const res = response.data;
          //response.data는 jsonparse필요없음
          if (res.query_summary?.num_reviews === 0) {
            return;
          } else {
            for (let j of res.reviews) {
              const { recommendationid } = await check(n);
              if (!recommendationid) {
                await client.create({
                  index: "review_data",
                  id: "??",
                  body: {
                    doc: {
                      appid: n,
                      recommendationid: j.recommendationid,
                      steamid: j.author.steamid,
                      playtime_at_review: j.author.playtime_at_review,
                      language: j.language,
                      review: j.review,
                      timestamp_updated: j.timestamp_created,
                      voted_up: j.voted_up,
                      votes_up: j.votes_up,
                      votes_funny: j.votes_funny,
                      weighted_vote_score: j.weighted_vote_score,
                      written_during_early_access:
                        j.written_during_early_access,
                    },
                  },
                });
              } else {
                console.log("이미있어서 디비에 안넣음");
              }
            }
          }
        }
      }
    })
    .catch(async () => {
      await setTimeoutPromise(6000);
      await work(n, index);
    });
}

test = async () => {
  let num = Worker.threadId;
  let start = 150000; // appid가 150000이하인 게임들은 리뷰가 없을 확률이 많아서?
  let list = await finAllList(num, start);
  //game테이블에서 리스트 구합니다.
  //배열을 2개씩 나눕니다.
  let index = 0;
  for (const i of list) {
    //두개씩있는 배열 반복
    let n = i.appid;
    index++;
    await work(n, index);
    await setTimeoutPromise(1000);
  }
};
let finAllList = async (offset, start) => {
  //게임 리스트
  let list = await Games.findAll({
    attributes: ["appid"],
    raw: true,
    offset: (offset - 1) * Math.floor(2518 / 3) + start,
    limit: Math.floor(2518 / 3),
  });
  return list;
}; // ?

let checkReview = async (appid) => {
  let list = await Reviews.findOne({
    where: {
      appid,
      language: "english",
    },
    raw: true,
  });
  return list !== null;
};

let existReview = async (appid, steamid, timestamp_updated) => {
  let list = await Reviews.findOne({
    where: {
      appid,
      steamid,
      timestamp_updated,
      language: "english",
    },
    raw: true,
  });
  return list !== null;
};
test();
let check = async (appid) => {
  const list = await client.search({
    index: "review_data",
    body: {
      query: {
        bool: {
          must: [
            { match: { appid: appid } },
            { exists: { recommendationid: "img_url" } },
          ],
        },
      },
    },
  });
  if (list.hits.total["value"]) {
    return list.hits.hits[0]._source.recommendationid;
  } else {
    console.log("통과");
    return false;
  }
};
