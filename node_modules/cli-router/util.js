/**
 * 2017年8月9日 星期三
 * Joshua Conero
 * 公共函数
 */
var Util = {
    /**
     * 子数组后去
     * @param {Array} array 
     * @param {int} len 
     * @param {int} start 
     */
    SubArray(array, len, start){
        var newArray = new Array()
        start = start? start - 1 : 0
        if(!len) len = array.length
        else len = len > array.length ? array.length:len;
        while(start < len){
            newArray.push(array[start])
            start += 1
        }
        return newArray
    }
} 
module.exports = Util