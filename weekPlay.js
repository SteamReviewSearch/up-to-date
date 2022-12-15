const mainThread=require('./new_game/index_game')
function setTimeoutPromise(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), ms);
    });
  }
const schedule=async()=>{
    let plan=new Date().toISOString();
    do {
        const now = new Date();
        let year = now.getFullYear(); // 년
        let month = now.getMonth();   // 월
        let day = now.getDate();      // 일
        let hours = now.getHours(); // 시
        let minutes = now.getMinutes();  // 분
        let seconds = now.getSeconds();  // 초
        let today= new Date(year, month, day,hours,minutes,seconds).toISOString();
        if(today >= plan){
            await new mainThread().index_game()
            plan=new Date(year, month, day+7).toISOString();
            console.log(plan)
        }
        console.log("now: ",today)
        await setTimeoutPromise(360000);
    } while (1);
}
schedule();