/**
 * io 测试学习
 * 2017年8月11日 星期五
 */

const fs = require('fs')


class IO{
    constructor() {
        this.FileStat()
    }
    FileStat(){
        // var fstat = fs.statSync('env.json')
        var fstat = fs.statSync('env.json2')
        console.log(fstat)
        var dt = new Date(fstat.mtime)
        var dt1 = new Date()
        console.log(dt1)
        console.log(dt.getTime(), dt1.getTime(), (dt1.getTime() - dt.getTime())/(1000*60*60))
    }
}

new IO()