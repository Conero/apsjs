/**
 * fileseach 文件搜索器
 * 2017年8月29日 星期二
 */

const fs = require('fs')
 
const util = require('./util')
const sys = require('./sysconfig')

const CmdDir = process.cwd().replace(/\\/g, '/') + '/'


/**
 * 文件搜索主入口
 */
exports.Su = (argv, pref) =>{
    class Su{
        constructor(){
            // 内部值
            this.InterVariable = {}

            var cmd = argv[0] || null
            var value = argv[0] || null
            if(cmd){
                var tArr = util.cmdSplit(cmd)
                cmd = tArr[0]
                value = tArr[1] || null
            }
            this.cmd = cmd
            this.value = value
            // 命令行匹配
            this.MapCommand()
            this.UserSaveAbleConf = null
            
        }
        /**
         *  获取内部变量 
         * @param {string} key 
         * @param {any} def 
         * @param {boolean} initMk 
         */
        GetInner(key, def, initMk){
            def = def || null         
            var inner = this.InterVariable[key] || null        
            def = inner || def
            if(!inner){
                this.InterVariable[key] = def
            }
            return def
        }
        /**
         * 内部变量新增
         * @param {string} key 
         * @param {number} v 
         * @return {number}
         */
        InnerAdd(key, v){
            v = v || 1
            this.InterVariable[key] += v
            return this.InterVariable[key]
        }
        /**
         * 命令行匹配
         */
        MapCommand(){
            if(!this.cmd) return this.Doc()
            if(util.CmdCheck(this.cmd, ['fs', 'f'])){
                this.FileSeachAction()
            }
            else if(util.CmdCheck(this.cmd, ['help', '?'])){
                this.Doc()
            }
        }
        /**
         * 显示信息到命令行
         * @param {any} msgArray 
         */
        Show(msgArray){
            var msg = ('object' == typeof msgArray)? msgArray.join('\r\n'): msgArray
            console.log(msg)
        }
        /**
         * 文档
         */
        Doc(){
            var msg = `${pref}$  --fs/f   --fs/f=参数      文件内容搜索` + 
                      `${pref}$      | -> 1) 搜索语法：*.js        搜索所有js后缀的文件` + 
                      `${pref}$      | -> 2) 搜索语法：基本用git 的 .gitignore 语法相似` + 
                      `${pref}$` + 
                      `${pref}$           --help/?`
            console.log(msg)
        }
        /**
         * 目录遍历
         * @param {string} path 
         */
        ReadDirHandler(path){
            var files = fs.readdirSync(path)                            
            for(var k in files){
                var el = files[k]
                var cPath = path + '/' + el
                if(fs.statSync(cPath)
                    .isDirectory()
                ){
                    // 缓存目录不进行遍历
                    if('.apsjs' == el) continue;
                    this.ReadDirHandler(cPath)
                }
                else{                    
                    // 精确搜索
                    if(-1 == this.value.indexOf('*') && el == this.value){
                        var Idx = this.InnerAdd('sCount')
                        this.Show(`${pref} :) ${Idx}.    ---->  ${el}      | ${path}`) 
                    // 后缀式搜索
                    }else if(0 == this.value.indexOf('*')){ // *.js
                        if(el.lastIndexOf(this.value.replace('*',''))){
                            var Idx = this.InnerAdd('sCount')
                            this.Show(`${pref} :) ${Idx}.    ---->  ${el}      | ${path}`) 
                        }  
                    // 前缀是搜索
                    }else if(0 == this.value.lastIndexOf('*')){ // *.js
                        if(el.indexOf(this.value.replace('*',''))){
                            var Idx = this.InnerAdd('sCount')
                            this.Show(`${pref} :) ${Idx}.    ---->  ${el}      | ${path}`) 
                        }  
                    }else if(this.InterVariable['sReg'] && this.InterVariable['sReg'].test()){
                        var Idx = this.InnerAdd('sCount')
                        this.Show(`${pref} :) ${Idx}.    ---->  ${el}      | ${path}`)      
                    }                    
                    //console.log(el)
                }                
            }
        }
        /**
         * 文件资源搜索
         */
        FileSeachAction(){
            var value = this.value
            if(value){        
                this.GetInner('sCount', 0, true)
                if(this.value.indexOf('*') > -1){
                    var v4r = this.value.replace(/\./g, '\\.')
                    v4r = v4r.replace(/\*/g, '.*')
                    // console.log('/^' + v4r + '$/')
                    var sReg = new RegExp('/^' + v4r + '$/')
                    this.InterVariable['sReg'] = sReg
                }
                this.ReadDirHandler(CmdDir) 
            }
            else{
                this.Show(`${pref}-:)  搜索不可为空……`)
            }           
        }
    }
    return new Su
}