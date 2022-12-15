//node --experimental-worker <file>

module.exports = class mainThread {
  setTimeoutPromise(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), ms);
    });
  }
  index_game = async () => {
    const { Worker } = require("worker_threads");
    let startTime = process.uptime(); // 프로세스 시작 시간
    let jobSize = 10;
    let myWorker1,
      myWorker2,
      myWorker3,
      myWorker4,
      myWorker5,
      myWorker6,
      myWorker7,
      myWorker8,
      myWorker9,
      myWorker10,
      myWorker11,
      myWorker12,
      myWorker13,
      myWorker14,
      myWorker15,
      myWorker16,
      myWorker17,
      myWorker18,
      myWorker19,
      myWorker20;

    myWorker1 = new Worker(__dirname + "/all_game_update.js");
    myWorker2 = new Worker(__dirname + "/all_game_update.js");
    myWorker3 = new Worker(__dirname + "/all_game_update.js");
    myWorker4 = new Worker(__dirname + "/all_game_update.js");
    myWorker5 = new Worker(__dirname + "/all_game_update.js");
    myWorker6 = new Worker(__dirname + "/all_game_update.js");
    myWorker7 = new Worker(__dirname + "/all_game_update.js");
    myWorker8 = new Worker(__dirname + "/all_game_update.js");
    // myWorker9 = new Worker(__dirname + "/game.js");
    // myWorker10 = new Worker(__dirname + "/game.js");
    // myWorker11 = new Worker(__dirname + "/game.js");
    // myWorker12 = new Worker(__dirname + "/game.js");
    // myWorker13 = new Worker(__dirname + "/game.js");
    // myWorker14 = new Worker(__dirname + "/game.js");
    // myWorker15 = new Worker(__dirname + "/game.js");
    // myWorker16 = new Worker(__dirname + "/game.js");
    // myWorker17 = new Worker(__dirname + "/game.js");
    // myWorker18 = new Worker(__dirname + "/game.js");
    // myWorker19 = new Worker(__dirname + "/game.js");
    // myWorker20 = new Worker(__dirname + "/game.js");
    let endTime = process.uptime();
    console.log("main thread time: " + (endTime - startTime)); // 스레드 생성 시간 + doSomething 처리하는 데 걸린 시간.
    let result=0;
    //스레드 수
    while(result<8){
      myWorker1.on('exit',()=>{
        result++;
      })
      myWorker2.on('exit',()=>{
        result++;
      })
      myWorker3.on('exit',()=>{
        result++;
      })
      myWorker4.on('exit',()=>{
        result++;
      })
      myWorker5.on('exit',()=>{
        result++;
      })
      myWorker6.on('exit',()=>{
        result++;
      })
      myWorker7.on('exit',()=>{
        result++;
      })
      myWorker8.on('exit',()=>{
        result++;
      })
      await this.setTimeoutPromise(360000)
    }
    return true;
  };
};
