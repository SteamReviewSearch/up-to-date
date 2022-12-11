const client = require("../ELK_connection");
const Worker = require("worker_threads");
var _ = require("lodash");
const https = require("https");
var request = require("sync-request");
const axios = require("axios");
//데이터베이스 접속 변수
//작동코드

const EngReview = require('./review_english')
const KorReview = require('./review_kor')

const eng = new EngReview()
const kor = new KorReview()

function setTimeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

async function work(n, name, index, worker) {
  //반복문을 동기처리 및 실패시 재접속을 위한 함수화
  //n:appid
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
        if (
          res[n].success &&
          res[n].data.img_url !== null &&
          res[n].data.short_description !== null
        ) {
          const result = res[n].data;
          const exist = await check(n);
          if (!exist) {
            if (result.metacritic) {
              // url만 뽑아서 Games에 저장
              await client.index({
                index: "games_data",
                id: n,
                refresh: true,
                body: {
                  params: { retry_on_conflict: 6 },
                  name: result.name,
                  name_eng: name,
                  img_url: result.img_url,
                  appid: n,
                  short_description: result.short_description,
                  supported_language: result.supported_language,
                  categories: result.categories,
                  type: result.type,
                  genres: result.genres,
                  release_date: result.release_date,
                  platforms: result.platforms,
                  price_overview: result.price_overview,
                  metacritic: result.metacritic,
                  recommendations: result.recommendations,
                  pass: true,
                },
              });
              await eng.work(n, index, worker)
              await kor.work(n, index, worker)

            } else {
              await client.index({
                index: "games_data",
                id: n,
                refresh: true,
                body: {
                  params: { retry_on_conflict: 6 },
                  name: result.name,
                  name_eng: name,
                  img_url: result.img_url,
                  appid: n,
                  short_description: result.short_description,
                  supported_language: result.supported_language,
                  categories: result.categories,
                  type: result.type,
                  genres: result.genres,
                  release_date: result.release_date,
                  platforms: result.platforms,
                  price_overview: result.price_overview,
                  recommendations: result.recommendations,
                  pass: true,
                },
              });
              await eng.work(n, index, worker)
              await kor.work(n, index, worker)

            }
          } else {
            if (result.metacritic) {
              await client.update({
                index: "games_data",
                refresh: true,
                id: exist._id, //이거 뭔뜻?
                body: {
                  doc: {
                    params: { retry_on_conflict: 6 },
                    name: result.name,
                    name_eng: name,
                    img_url: result.img_url,
                    appid: n,
                    short_description: result.short_description,
                    supported_language: result.supported_language,
                    categories: result.categories,
                    type: result.type,
                    genres: result.genres,
                    release_date: result.release_date,
                    platforms: result.platforms,
                    price_overview: result.price_overview,
                    metacritic: result.metacritic,
                    recommendations: result.recommendations,
                    pass: true,
                  },
                },
              });
              await eng.work(n, index, worker)
              await kor.work(n, index, worker)

            } else {
              await client.update({
                index: "games_data",
                refresh: true,
                id: exist._id, //이거 뭔뜻?
                body: {
                  doc: {
                    params: { retry_on_conflict: 6 },
                    name: result.name,
                    name_eng: name,
                    img_url: result.img_url,
                    appid: n,
                    short_description: result.short_description,
                    supported_language: result.supported_language,
                    categories: result.categories,
                    type: result.type,
                    genres: result.genres,
                    release_date: result.release_date,
                    platforms: result.platforms,
                    price_overview: result.price_overview,
                    recommendations: result.recommendations,
                    pass: true,
                  },
                },
              });
              await eng.work(n, index, worker)
              await kor.work(n, index, worker)

            }
          }
        } else {
          const { exist } = await check(n);
          if (exist) {
            await client.update({
              index: "games_data",
              refresh: true,
              id: exist,
              body: {
                doc: {
                  params: { retry_on_conflict: 6 },
                  appid: n,
                  pass: false,
                },
              },
            });
            console.log(`
${worker}| PASS 
${worker}| [${n}]`);
          } else {
            await client.index({
              index: "games_data",
              refresh: true,
              id: n,
              body: {
                params: { retry_on_conflict: 6 },
                appid: n,
                pass: false,
              },
            });
            console.log(`
${worker}| PASS 
${worker}| [${n}]`);
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
  // 나 === 0 | 민재님 === 5333 | 성영님 === 10666 설정 후 node start.
  // 스레드 15개, 스레드당 10000개씩 3명의 컴퓨터가 3분할하여 크롤링. 이론상 15시간이면 크롤링 완료 
  let start = 0;
  let { list, start_point } = await finAllList(num, start);
  if (!list) return;
  let num_art = ""
  for (let i = 0; i < (num - 1) * 13; i++) {
    num_art += " "
  }
  let index = start_point;
  for (const i of list) {
    //두개씩있는 배열 반복
    let n = i.appid;
    let name = i.name;
    console.log(`
${num_art}| ${index}-game 
${num_art}| [${n}]`);
    index++;
    const result = await work(n, name, index, num_art);
    // console.log(result)
    if (result) await setTimeoutPromise(1000);
  }
};


let finAllList = async (offset, start) => {
  //게임 리스트
  await setTimeoutPromise((offset - 1) * 30000) // 30초에 하나씩 시작
  let res = await request(
    "Get",
    "https://api.steampowered.com/ISteamApps/GetAppList/v2"
  );
  if (res.getBody("utf8") !== undefined) {
    const response = JSON.parse(res.getBody("utf8"));
    if (res.getBody("utf8").slice(0, 6) !== "<HTML>") {
      let apps = response.applist.apps;
      let start_point = ((offset - 1) * 16000) + start
      const log = `
      ===================================================================
        ${offset}-Worker START!! | 시작: ${start_point} | ${offset < 10 ? "30초 뒤 다음 worker 시작" : "Worker threads 시작 완료"} 
      ===================================================================
            `

      // 마지막 스레드 분기처리
      if (offset === 10) {
        if (start_point < apps.length) {
          if (start_point + 5333 > apps.length) {
            console.log(log)
            return { list: apps.slice(start_point, -1), start_point };
          } else {
            console.log(log)
            return { list: apps.slice(start_point, start_point + 5333), start_point };
          }
        }
        console.log(`${offset} - 이번 스레드가 필요가 없음 Worker threads 시작 완료`)
        return { list: false, start_point };
      }
      // const list = apps.slice(start_point, (offset - 1) * 10000 + 9999 + start) //스레드 15개로 혼자 돌린다 쳤을 때
      const list = apps.slice(start_point, start_point + 5333)

      console.log(log)
      return { list, start_point };
    } else {
      console.log(res.body.slice(0, 6) + i);
    }
  }
};

let check = async (appid) => {
  const list = await client.search({
    index: "games_data",
    body: {
      query: {
        bool: {
          must: [{ match: { appid: appid } }],
        },
      },
    },
  });
  if (list.hits.hits.length) {
    return list.hits.hits[0];
  } else {
    return false;
  }
};

test();
