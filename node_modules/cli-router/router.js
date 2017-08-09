/**
 * cli - router
 * 2017年8月9日 星期三
 * Joshua Conero
 */
"use strict"

const util = require('./util')
const about = require('./package.json')

class Router{        
    constructor() {
        // 命令函数
        this.argv = process.argv.length > 2? util.SubArray(process.argv, null, 3): null
        // 解决方法堆栈
        this.handlerStack = {}
        this.actionStack = {}

        this.command = null
        this.about = about
        this.version = about.version
        this.CmdDir = process.cwd()
        // 命令文档
        this.doc = '';
        // 输出前缀
        // this.showpref = '\r\t'
        this.visualTb = `    `
        this.showpref = "\r\n" + this.visualTb
        this._docStackArray = new Array()
    }

    /**
     * 选项设置
     * @param {string|array} key  1->1; 2->1 (命令，请指定消息)
     * @param {string|callback} handler 处理函数 => (command, argv)
     * @param {string} doc 文档自动生成 
     * @return Router
     */   
    Option(key, handler, doc){
        if('object' == typeof key){
            for(var i=0; i<key.length; i++){
                this.handlerStack[key[i]] = handler
            }
            // 文档生成
            if(doc){
                var docTitle = key.join(' | ')
                this._docStackArray.push(this.showpref + `$ --${docTitle}  ${doc}`)
            }
        }else{
            this.handlerStack[key] = handler
            // 文档生成
            if(doc){
                this._docStackArray.push(this.showpref + `--${key}  ${doc}`)
            }
        }        
        return this
    }    
    /**
     * 自定义方法接口
     * @param {string} key 
     * @param {array} argv 
     * @return {bool} true 中断命名指令匹配(命令中具有最高优先级) callback() => {}
     */
    Action(callback, doc){
        if('function' == typeof callback){
            this.actionStack[key] = callback;
            // 文档生成
            if(doc){
                this._docStackArray.push(this.showpref + `--${key}  ${doc}`)
            }
        }
        return this 
    }
    /**
     * 获取命令文档
     * @return {string}
     */
    GetDoc(){
        if(!this.doc && this._docStackArray.length > 0){
            this.doc = this._docStackArray.join('')
        }
        return this.doc
    }
    //----------------------------- 接口函数(begin) -------------------------------
    /**
     * 命令未发现时
     * @param {string} cmd
     */
    NotFind(cmd){}
    /**
     * 命令出错时 - go-like
     * @param {string} msg
     */
    Panic(msg){}
    /**
     * 空命令时
     */
    EmptyCommand(){
        var doc = this.GetDoc()
        if(doc){
            //this.CommandFormat(`Let's Doing Some Good, Com'on`)
            console.log()
            console.log(this.visualTb + `Let's Doing Something Good, Com'on. `)
            console.log(this.visualTb + `We Guys Always Do the Best, do't we? `)
            console.log(doc)
        }
    }
    /**
     * 命令格式化初始
     * @param {*} msg 
     * @param {bool} feek  是否返回数据字符
     */
    CommandFormat(msg, feek, isError){
        var tError = isError? '(:' : ':)-'
        var formated = `${this.showpref} ${tError} ${msg}`
        if(feek) return formated
        console.log(formated)
    }    
    //----------------------------- 接口函数(end) -------------------------------
    /**
     * 运行命令函数 
     */    
    Run(){
        var command = this.argv? this.argv[0]: null    
        if(!command){
            this.EmptyCommand()
            return
        }   
        this.argv = util.SubArray(this.argv, null, 2)
        var command = command.trim().toLowerCase()
        if(command.indexOf('--') == 0) command = command.replace('--', '')
        if(command.indexOf('-') == 0) command = command.replace('-', '')                    
        // 记录到当前对象
        this.command = command         
        // 自定方法检测
        for(var k in this.actionStack){
            // 直接中断
            if(this.actionStack[k](command, this.argv)) return
        }
        
        // 默认命令检测
        for(var k in this.handlerStack){
            // 命令匹配
            if(command == k){
                // 回调函数直接运行回调函数
                if('function' == typeof this.handlerStack[k]){
                    this.handlerStack[k].call()
                }
                else this.CommandFormat(this.handlerStack[k])
                return
                // break
            }
        }
        this.NotFind(command)
    }
}

module.exports = Router