//node --experimental-worker <file>
async function index_game() {
  const { Worker } = require("worker_threads");
  let startTime = process.uptime(); // 프로세스 시작 시간
  let jobSize = 10;
  let myWorker1, myWorker2, myWorker3, myWorker4, myWorker5, myWorker6
  myWorker1 = new Worker(__dirname + "/game.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker2 = new Worker(__dirname + "/game.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker3 = new Worker(__dirname + "/game.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker4 = new Worker(__dirname + "/game.js");
  myWorker5 = new Worker(__dirname + "/game.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker6 = new Worker(__dirname + "/game.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  let endTime = process.uptime();
  console.log("main thread time: " + (endTime - startTime)); // 스레드 생성 시간 + doSomething 처리하는 데 걸린 시간.
}
module.exports = index_game;
index_game();
