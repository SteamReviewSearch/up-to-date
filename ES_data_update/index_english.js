//node --experimental-worker <file>
async function index_english() {
  const { Worker } = require("worker_threads");
  let startTime = process.uptime(); // 프로세스 시작 시간
  let jobSize = 10;
  let myWorker1, myWorker2, myWorker3, myWorker4, myWorker5;
  myWorker1 = new Worker(__dirname + "/review_english.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker2 = new Worker(__dirname + "/review_english.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  myWorker3 = new Worker(__dirname + "/review_english.js"); // 스레드를 생성해 파일 절대경로를 통해 가리킨 js파일을 작업
  // myWorker4 = new Worker(__dirname + "/check_english.js");
  let endTime = process.uptime();
  console.log("main thread time: " + (endTime - startTime)); // 스레드 생성 시간 + doSomething 처리하는 데 걸린 시간.
}
module.exports = index_english;
index_english();
