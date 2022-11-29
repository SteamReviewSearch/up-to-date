const client = require("../ELK_connection");
const Worker = require("worker_threads");
var _ = require("lodash");
const https = require('https')
const { Op } = require("sequelize");
const { Games, Reviews, Metascores } = require("../models");

//-- SELECT * FROM `steam_datas`.`Reviews` Order by appid asc LIMIT 1000;
// SELECT DATE_FORMAT(createdAt, '%Y%m%d') AS date, count(*) AS cnt
// FROM `steam_datas`.`Reviews`
// GROUP BY DATE_FORMAT(createdAt, '%Y%m%d') ORDER BY date DESC;
const axios = require("axios");
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
  const { id, name } = await check(n)
  if (!id) {
    return false;
  }
  console.log("index : " + index + "/ name : " + name + "/ id " + id);
  await setTimeoutPromise(5000);
  await axios
    .get(`https://store.steampowered.com/api/appdetails?appids=${n}`, {
      contentType: "utf-8",
    }, {
      baseURL: `https://store.steampowered.com/`,
      timeout: 60000, //아웃바운드 문제 - 포트복제등이 timeout으로 쌓이다보니까 나중에 요청을 보내지를 못함. 
      httpsAgent: new https.Agent({ keepAlive: true }),
      headers: { 'Content-Type': 'application/xml' }
    })
    .then(async (response) => {
      // null값은 위에서 잡힘
      // 반환값이 null도 아니고 string '' 인 경우가 있음
      if (response.data !== '') {
        const res = response.data;
        if (res[n].success) {
          // url만 뽑아서 Games에 저장 
          await client.update({
            index: "game_data",
            id: id,
            body: {
              doc: {
                type: res[n].data.type,
                short_description: res[n].data.short_description,
                categories: res[n].data.categories,
                supported_languages: res[n].data.supported_languages,
                metacritic: res[n].data.metacritic,
              }
            }
          });
        } else {
          return false;
        }
      }
    }).catch(async (error) => {
      console.log("멈춤 => " + error.response.data)
      await setTimeoutPromise(100000)
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
    let n = i.appid;
    index++;
    const result = await work(n, index);
    // console.log(result)
    if (result) await setTimeoutPromise(1000)
  }
};
let finAllList = async (offset, start) => {
  //게임 리스트
  let list = await Games.findAll({
    attributes: ["appid"],
    raw: true,
    offset: (offset - 1) * 50000 + start,
    limit: 50000
  });
  return list;
};
let check = async (appid) => {
  const list = await client.search({
    index: "game_data",
    body: {
      query: {
        bool: {
          must: [
            { match: { appid: appid } },
            { exists: { field: "review_score_desc" } },
          ],
          must_not: [
            { exists: { field: "categories" } },
          ]
        }
      }
    }
  })
  return list.hits.total["value"] ? { id: list.hits.hits[0]._id, name: list.hits.hits[0]._source.name } : false;
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
              { match: { name: 'call of duty ' } },
              { exists: { field: "review_score_desc" } },
            ],
          }
        }
      }
    });
    console.log(list)
    return;
  } catch (error) {
    throw error;
  }
};
