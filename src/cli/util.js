/**
 * 2017年8月11日 星期五
 * 公共处理函数
 */

 /**
  * 获取日期函数(标准格式)
  * @return {string}
  */
exports.getdate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
}
/**
 * @param {string} str 字符串
 */
exports.base64_encode = (str) => new Buffer(str).toString('base64')
/**
 * @param {string} str 字符串
 */
exports.base64_decode = (str) => new Buffer(str, 'base64').toString()
/**
 * 运行时统计
 */
exports.runtime = () =>{
    class R{
        constructor(){
            this.startTime = new Date()
        }
        /**
         * 获取运行的时长秒(s)
         * @return {int}
         */
        getRunSecond(){
            return this.getMicroSec()/1000
        }
        /**
         * 获取毫米数/ ms
         * @return {int}
         */
        getMicroSec(){
            return (new Date()).getTime() - this.startTime.getTime()
        }
    }
    return new R()
}
/**
 * 命名行比较
 * @param {string} cmd  用户输入的原始命令行
 * @param {string|array} ref  参照命令
 * @param {bool} isRaw  是否为原样字符，不去除(--/-)等
 * @param {bool} noLowwer  不区分大小写
 * @return {bool}
 */
exports.CmdCheck = (cmd, ref, isRaw, noLowwer) =>{
    if(!cmd) return false
    if(!isRaw){
        if(cmd.indexOf('--') > -1) cmd = cmd.replace('--', '')
        if(cmd.indexOf('-') > -1) cmd = cmd.replace('-', '')
    }else{
        // -- 和 - 兼容
        if(cmd.indexOf('--') > -1) cmd = cmd.replace('--', '-')
        // 不是有效的命名行，原样字符必须有 --/- 开头
        if(cmd.indexOf('-') == -1) return false
        if('object' == typeof ref){
            for(var i=0; i<ref.length; i++){
                if(ref[i].indexOf('-') == -1) ref[i] = '-' + ref[i]
            }
        }else ref = '-' + ref
    }
    if(!noLowwer) cmd = cmd.toLowerCase()
    if('object' == typeof ref){
        return ref.indexOf(cmd) > -1
    }
    else return ref === cmd
}
/**
 * 分割cmd命令， 如 cmd = value => (cmd,value)
 */    
exports.cmdSplit = (cmd, split) =>{
    var value = null
    if(cmd){
        split = split || '='
        if(cmd.indexOf(split) > -1){
            var tempArray = cmd.split(split)
            cmd = tempArray[0].trim()
            value = tempArray[1].trim()
        }
    }
    return [cmd, value]
}
/**
 * 时间比较 dt2 - dt
 * @param {string|object} dt
 * @param {string|object} dt2
 * @return {int}
 */
exports.timeDiffSecond = (dt, dt2) => {
    dt = 'object' == typeof dt? dt : (new Date(dt))
    dt2 = dt2? ('object' == typeof dt2? dt2 : (new Date(dt2))): new Date()
    return (dt2.getTime() - dt.getTime())/1000
}
/**
 * cmd 过程提示框
 * @return {Object}
 */
exports.CmdProcessTip = () =>{
    class CPT{
        constructor(){
            this.timerId = null
            this.SetSec()
        }
        /**
         * 设置运行秒
         * @param {number} sec 
         * @return {*}
         */
        SetSec(sec){
            this.sec = sec || 2000
            return this
        }
        Star(callback){
            if('function' == typeof callback){
                callback = function(){
                    console.log('...')
                }
            }
            this.timerId = setInterval(callback, this.sec)
        }
        Stop(){
            if(this.timerId) clearInterval(this.timerId)
        }
    }
    return new CPT
}


