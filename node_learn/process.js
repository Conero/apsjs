/**
 * node 测试模块
 * 2017年8月11日 星期五
 * process
 */

 const fs = require('fs')
 class P{
     constructor(){
         //this.Evn()
         this.Scheduling()
     }
    
     // 环境变量
     Evn(){        
        //  console.log(process.env)
        //  写入文件
        //  fs.writeFileSync('./env.json', JSON.stringify(process.env, null, 4), (err) => {
        //      console.log(err)
        //  })

        // 环境列表
         var path = process.env.path
         var pathArr = path.split(';')         
         for(var i=0; i<pathArr.length; i++){
             var name = pathArr[i]
             console.log(`    ${name}`)
         }
         console.log(`    本次扫描发现： ${pathArr.length} 环境变量；${process.platform}`)
     }

    // 定时任务
    Scheduling(){
        var count = 10
        var i = 0
        var timeId = setInterval(function(){
            console.log(new Date())
            // 退出定时器
            if(i == count) clearInterval(timeId)
            i += 1
        }, 3000)
    }
 }


 new P


 