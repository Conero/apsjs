/**
 * 编译器
 * 2017年8月9日 星期三
 * Joshua Conero
 */

const fs = require('fs')
const path = require('path')
const util = require('./util')
const sys = require('./sysconfig')


const Setting = sys.Setting
/**
 * Html 解析器-主要用于自定义，基于正则表达式
 */
class HtmlParser{
    constructor(html){
        this._html = html
    }
    /*
    tag(tag, html){
        ;
    }
    */
    /**
     * 单行字符解析，并获取attr
     * @param {string} tag 
     * @param {string|null} line 
     * @return {object}
     */
    TagFromOneLine(tag, line){
        var elment = {attr:{},hasTag:false}
        line = line || this._html
        if(line && line.indexOf('<'+tag) > -1){
            line = line.replace('<'+tag, '').replace('>', '').replace('/>', '').trim()
            var arr = line.split(' ')
            for(var i=0; i<arr.length; i++){
                var value = arr[i]
                if(!value) continue
                var idx = value.indexOf('=')
                var key = value.substr(0, idx)
                var v = value.substr(idx+1)
                if(v) v = v.replace(/\"|\"/g, '')
                elment.attr[key] = v? v:true
            }
            elment.hasTag = true
        }
        // 获取属性
        elment.getAttr = function(pkey){
            return pkey? (this.attr[pkey] || ''):''
        }
        return elment
    }
}

/**
 * 新编译器： 根据目录下配置文件进行相关编译. since 20170831
 */
class SuCompiler{
    /**
     * 项目初始化
     * @param {Object} middleware 
     */
    constructor(middleware){
        this.middleware = middleware    // 中间件
        this.MapSuccessMk = false       // 符合路由标记
        this.configName = sys.get('compile_init_file')  // 获取配置模板名称
        this.configPath = sys.CmdDir + '/' + this.configName    // 配置模板路径        
        this.useConfJsonData = null     // 用户配置模板内容
    }    
    /**
     * 获取系统初始化 JSON 
     * @return {JSON}
     */
    GetInitJson(){
        return {
            "source_dir": "编译资源根目录",
            "target_dir": "编译目标根目录",
            "main_script":  "cmake.tpl.js",       // 主入口文件
            "auto_create_main": 'Y'              // 模块中不存在入口编译文件时自动是否自动生成，默认是
        }
    }
    /**
     * 初始化是否成功
     */
    IsInitSuccess(){
        return fs.existsSync(this.configPath)
    }
    /**
     * 获取用户配置值
     * @return {null|JSON}  为空时标识模板不存在
     */
    GetUserConf(){
        if(fs.existsSync(this.configPath) && !this.useConfJsonData){
            this.useConfJsonData = require(this.configPath)            
        }
        return this.useConfJsonData
    }
    /**
     * 获取用户配置的值
     * @param {string} key 
     * @param {any} def 
     */
    GetUserValue(key, def){
        def = def || null
        var json = this.GetUserConf()
        if(json){
            def = json[key] || def
        }
        return def
    }
    InitAction(){
        console.log(this.middleware.pref + '--init 正在执行……')
        var IsForceMk = (this.value && 'FORCE' == this.value.toUpperCase())? true:false     
        if(false == IsForceMk && fs.existsSync(this.configPath)){
            console.log(this.middleware.pref + `${this.configName} 文件以及存在，无须再初始化.`)
        }
        else{
            fs.writeFileSync(this.configPath, JSON.stringify(this.GetInitJson(), null, 4))
            var msg = IsForceMk? `${this.configName} 已经强制初始化.`:`${this.configName} 初始化成功.`
            console.log(this.middleware.pref + msg)
        }   
    }
    /**
     * require 命令转变为字符串
     * @param {string} path 
     * @param {Object} ScriptVaule 
     */
    CmakeRequireTpl2Str(path, ScriptVaule){
        var reg = /^\.\//
        var filename = reg.test(path)? path.replace(reg, ScriptVaule.module_dir) : path
        //this.middleware.SuccessMsg(filename)
        var content = ''
        if(fs.existsSync(filename)){
            var TmpTurple = this.middleware.compiler(filename, 'RAWC')
            content = TmpTurple[0]
            if(TmpTurple[1]) this.CmakeMsgQueue(TmpTurple[1])
        }
        return content
    }

    /**
     * 全局 $script 处理
     * @param {string} line 行字符串
     * @param {Object} ScriptVaule 脚本全局值
     */
    CmakeScriptElement(line, ScriptVaule){
        ScriptVaule = ScriptVaule||{}
        var equilStr = '='
        var eqIdx = line.indexOf(equilStr)
        var key = line.substr(0, eqIdx).trim()
        var value = line.substr(eqIdx + 1).trim()
        var mkStrReg = /\'|\"/g
        // require 标签
        if(/require/i.test(value)){
            //value = /\'.*\'/
            var tmpArray = value.match(/\'.*\'/)
            var filename = tmpArray.length>0? tmpArray[0].replace(mkStrReg, '') : null
            var content = this.CmakeRequireTpl2Str(filename, ScriptVaule)
            // 编译模板值
            if(!ScriptVaule['__TPL__']) ScriptVaule['__TPL__'] = {}
            ScriptVaule['__TPL__'][key] = content
            return
        }
        else{
            value = value.replace(mkStrReg , '')            
        }
        ScriptVaule[key] = value
    }
    /**
     * 单模块编译
     * @param {string} md 
     * @return {boolean} 是否成功
     */
    CmakeSingleModule(md){
        //var mdPath = 
        // 内部方法使用方法，仅仅在调用方法是才产生的值 p{}V        
        var path = this.pSourceDirV + '/' + md + '/'
        var pStat = fs.statSync(path)
        if(!pStat.isDirectory()){
            this.CmakeMsgQueue(`${path} 不是有效目录！`, true)
            return false
        }
        var tplJsFile = path + this.GetUserValue('main_script', 'cmake.tpl.js')
        // 编译主文件检测是否存在
        if(!fs.existsSync(tplJsFile)){
            var auto_create_main = this.GetUserValue('auto_create_main', 'Y')
            if('Y' !== auto_create_main){
                this.CmakeMsgQueue(`${path} 不是有效目录！`, true)
                return false
            }            
        }else{
            var bf = fs.readFileSync(tplJsFile)
            var lines = bf.toString().split('\n')
            // 多行注释标记
            var isCommentMk = false
            // 脚本全局变量
            var ScriptVaule = {
                module_dir: path
            }
            var ScriptElReg = /^\$Script\./i
            // $Script.Begin
            var ScriptElStarReg = /^\$Script\.Begin$/i
            var ScriptElStarMk = false
            var ScriptString = ''
            var TplReg = /\$Script\.TPL\./i
            for(var i=0; i<lines.length; i++){    
                var line = lines[i].trim()

                // 空行跳过
                // 忽视行处理
                if(!line) continue     
                // 多行注释结束
                if(line.lastIndexOf('*/') != -1){
                    isCommentMk = false
                    continue
                }      
                // 多行注释开始 
                if(line.indexOf('/*') != -1){ isCommentMk = true }
                if(isCommentMk) continue
                if(line.indexOf('//') != -1){
                    continue
                }
                // 脚本开始
                if(ScriptElStarReg.test(line)){
                    ScriptElStarMk = true
                    continue
                }
                // 头标签处理
                if(ScriptElReg.test(line)){
                    this.CmakeScriptElement(line.replace(ScriptElReg, ''), ScriptVaule)
                }
                if(ScriptElStarMk){                    
                    if(TplReg.test(line)){
                        var Tpls = ScriptVaule['__TPL__'] || {}
                        for(var k in Tpls){
                            var tmpReg = null
                            eval(`tmpReg = /\\$Script\\.TPL\\.${k}/g`)
                            // console.log(tmpReg, Math.random())
                            if(tmpReg){
                                line = line.replace(tmpReg, Tpls[k])
                            }
                        }
                    }
                    ScriptString += line
                }
            }
            if(!fs.existsSync(this.pTargetDirV)){
                fs.mkdirSync(this.pTargetDirV)                
            }
            // 文件写入
            var targetFile = this.pTargetDirV + '/' + md + '/' +  (ScriptVaule['Cmake'] || md + '.js')
            fs.writeFileSync(targetFile, ScriptString)
            this.CmakeMsgQueue(`${md} 编译成功， 目标文件 ${targetFile} ！`)
            // console.log(ScriptVaule)
        }
    }
    /**
     * 全模块编译的实现
     */
    CmakeAllModule(){
        if(fs.existsSync(this.pSourceDirV)){
            var mds = fs.readdirSync(this.pSourceDirV)
            for(var i=0; i<mds.length; i++){
                var pathName = this.pSourceDirV + '/' + mds[i] + '/'
                if(!fs.statSync(pathName).isDirectory()){                    
                    continue
                }
                this.CmakeSingleModule(mds[i])
            }
        }else{
            this.middleware.ErrorMsg('您没有任何需要编译的模板！')
        }
    }
    /**
     * 编译消息队列
     * @param {string|undefined} msg  为空时获取否则写入
     * @param {boolean} errorMk 是否为错误信息
     * @param {boolean} feekRowQueue 返回原始队列
     * @return {string|null}
     */
    CmakeMsgQueue(msg, errorMk, feekRowQueue){
        if(!this.CmakeMsgQueuev){
            this.CmakeMsgQueuev = []
        }
        if(msg){
            msg = errorMk? this.middleware.ErrorMsg(msg, true): this.middleware.SuccessMsg(msg, true)
            this.CmakeMsgQueuev.push(msg)
        }else{
            return feekRowQueue? this.CmakeMsgQueuev : this.CmakeMsgQueuev.join('')
        }
    }
    CmakeAction(){   
        if(!this.IsInitSuccess()){
            return this.middleware.ErrorMsg('项目还没有初始化成功！')
        }
        var RunTime = util.runtime()

        // 配置 source_dir/target_dir 参数检测
        // 内部方法使用方法，仅仅在调用方法是才产生的值 p{}V
        if(!this.pSourceDirV){
            this.pSourceDirV = sys.CmdDir
            this.pTargetDirV = this.pSourceDirV
            var path = this.GetUserValue('source_dir')
            if(!path){
                return this.middleware.ErrorMsg('项目初始化时， 参数 source_dir 未设置!!')
            }
            // 不设置时自动用 source_dir 替换
            var tpath = this.GetUserValue('target_dir', path)
            if(!tpath){
                return this.middleware.ErrorMsg('项目初始化时， 参数 target_dir 未设置!!')
            }
            this.pSourceDirV += '/' + path            
            this.pTargetDirV += '/' + tpath 
            if(!fs.existsSync(this.pSourceDirV)) fs.mkdir(this.pSourceDirV)  
            if(!fs.existsSync(this.pTargetDirV)) fs.mkdir(this.pTargetDirV)  
        }
        // 编译执行
        if(this.value){
            this.middleware.SuccessMsg(`正在编译 ${this.value} 模板……`)
            this.CmakeSingleModule(this.value)
            console.log(this.CmakeMsgQueue())
        }
        else{
            this.middleware.SuccessMsg(`正在编译全部模板……`)
            this.CmakeAllModule()
            console.log(this.CmakeMsgQueue())
        }
        this.middleware.SuccessMsg(`本次用时 ${RunTime.getRunSecond()} s`)
    }
    /**
     * 新的编译器执行入口
     * @param {string} cmd
     * @param {string} value
     * @return {boolean}
     */
    RunNewCompiler(cmd, value){
        this.cmd = cmd
        this.value = value
        if(util.CmdCheck(cmd, ['i', 'init'], true)){
            this.MapSuccessMk = true
            this.InitAction()
        }else if(util.CmdCheck(cmd, ['c', 'cmake'], true)){
            this.MapSuccessMk = true
            this.CmakeAction()
        }
        return this.MapSuccessMk
    }
}


 /**
  * HTML编辑器
  * @param {string} filename 文件名
  * @return {object} middleware
  */
exports.Html2Js = (filename, pref) => {
    var __msg
    // js 脚本
    var __jsStr = ''
    var middleware = {
        pref : pref || `\r\n     `
    }
    var hp = new HtmlParser()    
    // 特殊符号，自动添加括号 三目运算符
    var sReg = /[\?\:\+\(\)\|\|]+/
    // 消息接口
    middleware.message = function(){
        return __msg
    }
    // 获取js 脚本
    middleware.getJs = function(){
        return __jsStr
    }
    // 点操作符转方括号符
    middleware.point2v = function(v){
        // data.key => data['key']
        var t = v
        if(v.indexOf('.') > -1 && v.indexOf('(') == -1){
            var tArray = v.split('.')
            t = tArray[0]
            for(var i=1; i<tArray.length; i++){
                t += `['${tArray[i]}']`
            }
        }
        return t
    }
    /**
     * 递归编译文本
     * @param {string} fname 文件名
     * @param {bool|string} rootCompileMk 根目录标识; RAWC 表示放回原始字符串
     * @return {array} (content/string, msg/string, functionname/string)
     */
    middleware.compiler = function(fname, rootCompileMk){
        var compilerFnName = 'ConeroCompilerFunction';
        var ext = sys.get('compiler_tpl_ext', '.html')
        var truple = [null, null]
        if(!fs.existsSync(fname) && fname.lastIndexOf(ext) < 0) fname += ext
        if(fs.existsSync(fname)){
            if(rootCompileMk) filename = fname;
            var bf = fs.readFileSync(fname)
            var lines = bf.toString().split('\n')
            var jsStrStack = []
            var jsContent = ''
            // var reg = /^\{\{[\#\da-zA-Z\s\$\.\_]*\}\}$/g
            // var reg = /^\{\{.*\}\}$/g
            // if 语句
            var ifContent = null
            var hasElseContent = false
            var reg = /\{\{[^\}]*\}\}/g
            for(var i=0; i<lines.length; i++){
                // 行脚本处理
                var line = lines[i]
                if(!line) continue
                // <!--注释行检测-->
                if(line.indexOf('<!--') > -1 && line.indexOf('-->') > -1) continue
                line = line.trim()   
                if(!line) continue
                    // 特殊命令处理
                var apsjs = hp.TagFromOneLine('apsjs', line)
                var isContinue = false
                if(apsjs.hasTag){
                    var item = apsjs.getAttr('item')
                    if(item) item = item.toLowerCase()
                    switch(item){
                        case 'import':  // 导入文件模板
                            var ccArr = middleware.compiler(apsjs.getAttr('file'))
                            if(ccArr[0]){
                                //jsStrStack.push(ccArr[0])
                                jsContent += ccArr[0]
                            }
                            isContinue = true
                            break;
                        case 'function': // 编译的函数名称
                            var __tfn = apsjs.getAttr('name');
                            if(__tfn) compilerFnName = __tfn;
                            isContinue = true;
                            break;
                    }                    
                }        
                if(isContinue) continue
                    // 模板解析 
                var vs = line.match(reg)  
                var lineContinueMk = false
                if(vs){
                    for(var j=0; j<vs.length; j++){
                        var raw = vs[j]
                        var v = ''                        
                        // {{/if}}
                        if(/\{\{\/if\}\}/i.test(raw)){
                            jsContent += ifContent + (hasElseContent? `') + '`: `':'') + '`)
                            ifContent = null
                            lineContinueMk = true
                            hasElseContent = false
                            continue
                        }
                        // {{/if}}
                        if(/\{\{\else\}\}/i.test(raw)){
                            ifContent += `' : '`
                            lineContinueMk = true
                            hasElseContent = true
                            continue
                        }
                        // {{if }}
                        if(/\{\{if/i.test(raw)){
                            v = raw.replace(/(\{\{if)|(\}\})/g, '').trim()
                            ifContent = `'+ ((${v})? '`
                            lineContinueMk = true
                            continue
                        }
                        v = raw.replace(/(\{\{)|(\}\})/g, '').trim()
                        // {{# k}}
                        if(0 === v.indexOf('#')){     
                            v = v.substr(1)                       
                            if(sReg.test(v)){
                                v = '(' + v.substr(1) + ')'
                            }
                        }else{
                            // d.k => d['k']
                            if(sys.get('compiler_point_clear')) v = middleware.point2v(v)
                        }
                        line = line.replace(raw, `'+ ${v} +'`)
                    }
                }    
                if(lineContinueMk){
                    continue
                    lineContinueMk = false
                }    
                //jsStrStack.push(`'${line}'`)
                if(ifContent) ifContent += line
                else jsContent += line
            }
            if(jsStrStack.length > 0){
                // 生成脚本处理                
                jsContent = jsStrStack.join(' + ')        
                if(rootCompileMk){
                    jsContent = 'RAWC' == rootCompileMk? `'${jsContent}'` : `function ${compilerFnName}(d){ return '${jsContent}';}`
                }
                truple[0] = jsContent
                truple[1] = `${filename} 文件已经成编译`            
            }
            if(jsContent){
                if(rootCompileMk){                    
                    jsContent = 'RAWC' == rootCompileMk? `'${jsContent}'` : `function ${compilerFnName}(d){ return '${jsContent}';}`
                }
                truple[0] = jsContent
                truple[1] = `${filename} 文件已经成编译`   
            }
            else{
                truple[1] = `${filename} 文件已经编译失败`
            }          
        }else{
            truple[1] = `${filename} 文件不存在`            
        }
        // 放回函数名称
        truple[2] = compilerFnName
        return truple
    }
    /**
     * 获取要编译的目标文件名
     */
    middleware.getNewFileName = function(fname){
        if(!fname) return ''     
        return path.dirname(fname) + '/' + path.basename(fname).replace(path.extname(fname), sys.get('compiled_tpl_ext', '.c.js'))
    }
    /**
     * 单文件编译
     */
    middleware.compilerSinglerFile = function(fname, showMk){
        var rtArr = this.compiler(fname, true)
        var compiledContentStr = rtArr[0]
        var compiledMsgStr = rtArr[1]
        if(compiledMsgStr){
            if(compiledContentStr){
                var cp = sys.compiler(filename)
                // 更新统计信息
                cp.updateInfo()
                compiledContentStr = `// v${cp.count} {${util.getdate()}; ${Setting.name}=v${Setting.version}/${Setting.publish}; ${Setting.create_date}; ${Setting.author}}\r\n`
                        + compiledContentStr 
                var newjs = this.getNewFileName(filename)
                compiledMsgStr += `${this.pref}${newjs} 文件成功生成(V${cp.count})！`
                fs.writeFileSync(newjs, compiledContentStr)
            }
            if(showMk) console.log(`${this.pref}${compiledMsgStr}`)
            else __msg = compiledMsgStr
        }else{
            if(showMk) console.log(`${this.pref}${compiledMsgStr}`)
            else __msg = compiledMsgStr
        }
    }
    /**
     * 通过缓存编译工作区域的所有文件
     * @param {bool} force
     */
    middleware.compilerAllByCache = function(force){
        var runtime = util.runtime()
        var cp = sys.compiler()
        var cacheJson = cp.getJsonInfo()
        var countCompiler = 0
        for(var k in cacheJson){
            var cmd = cacheJson[k]['cmd'] || null
            // 时间比较
            if(!force && cmd && fs.existsSync(cmd)){
                var fstat = fs.statSync(cmd)
                var sec = util.timeDiffSecond(fstat.mtime, cacheJson[k]['compile_time'])
                if(sec > 0){
                    console.log(`${this.pref}模板${cmd}已经十最新模板，无须进行编译.`)
                    continue
                }
            }        
            if(cmd){
                countCompiler += 1
                console.log(`${this.pref}模板${cmd}正在编译中……`)
                middleware.compilerSinglerFile(cmd, true)
            }
        }
        // console.log(cacheJson)
        console.log(`${this.pref}本次共编译${countCompiler}个文件，用时${runtime.getRunSecond()}s`)
    }
    /**
     * 显示缓存中存在的文件列表
     */
    middleware.showCacheCompileList = function(){
        var cp = sys.compiler()
        var cacheJson = cp.getJsonInfo()
        var countCompiler = 0
        var msg = '';
        for(var k in cacheJson){
            var cmd = cacheJson[k]['cmd'] || null
            if(cmd){
                countCompiler += 1
                msg += `${this.pref}${countCompiler}.  v${cacheJson[k]['compile_count']}  ${cmd} ------------${cacheJson[k]['compile_time']}`
            }
        }
        console.log(msg)
    }
    /**
     * 删除缓存的命令文件表
     */
    middleware.delCacheCompile = function(value){
        var msg = '';
        if(value){
            var cp = sys.compiler()
            var cacheJson = cp.getJsonInfo()
            var delCompiler = 0
            
            for(var k in cacheJson){
                var cmd = cacheJson[k]['cmd'] || null
                // 删除所有存储文件
                if('all' == value){
                    delete cacheJson[k]
                    delCompiler += 1
                    msg += this.pref + `${cmd} 从缓存列表中删除`
                }else if(cmd == value){
                    delete cacheJson[k]
                    msg += this.pref + `${cmd} 从缓存列表中删除`
                    continue
                }
            }
            cp.cache(cacheJson, true)
        }
        msg = msg || `${this.pref}(${value})命令行参数无效或者不存在，请指定要删除的缓存文件列表!!`;
        console.log(msg)
    }
    middleware.addCacheCompile = function(value){
        if(value){
            var cp = sys.compiler()
            var cacheJson = cp.getJsonInfo()
            var key = util.base64_encode(value)
            if(cacheJson[key]){
                cacheJson[key]['cmd'] = value
            }else{
                cacheJson[key] = {cmd: value, compile_count: 0, compile_time:util.getdate()}
            }
            cp.cache(cacheJson, true)
            console.log(`${this.pref} ${value}成功加入文件列表！`)
            middleware.showCacheCompileList()
        }
        else __msg = `您没有加入任何文件`
    }
    /**
     * 文档
     * @return {string}
     */
    middleware.Doc = () => {
        return `${middleware.pref}    $ --build/b      file                编译file为js` + 
               `${middleware.pref}    $ --build/b      .或--all/-all/      编译所有已经缓存的文件； --all=force 时强制编译，而不根据新旧判断` + 
               `${middleware.pref}    $ --build/b      --list/l            显示或有已经缓存的编译文件` + 
               `${middleware.pref}    $ --build/b      --remove/rm=file    清除缓存中的文件` + 
               `${middleware.pref}    $ --build/b      --remove=all        清除缓存中所有的文件` + 
               `${middleware.pref}    $ --build/b      --add/a=file        新增缓存中的文件` +
               // 根据模板编译 HTML
               `${middleware.pref}    $ --build/b      --init/i=force      初始化 "apsjs.compiler.json" 配置文件，force 强制执行    ` +              
               `${middleware.pref}    $ --build/b      --cmake/c=Module    根据 "apsjs.compiler.json" 配置自动编译文件， 配置 Module 时编译对应模块模板，否则全部    ` +               
               
               // 文档说明 
               `${middleware.pref}    $ --build/b      ?/--help              文档说明`
    }
    /**
     * 成功消息打印
     * @param {any} msg
     * @param {boolean} feekStr
     * @return {null|string}
     */
    middleware.SuccessMsg = (msg, feekStr) => {
        msg = `${middleware.pref}   :)-    ${msg}`
        if(feekStr){
            return msg
        }
        console.log(msg)
    }
    /**
     * 失败打印消息
     * @param {any} msg
     * @param {boolean} feekStr
     * @return {null|string}
     */
    middleware.ErrorMsg = (msg, feekStr) => {
        msg = `${middleware.pref}   -:)    ${msg}`
        if(feekStr){
            return msg
        }
        console.log(msg)
    }
    // 编译进行
    middleware.console = function(){
        // 子命令
        // 全编译，从缓存文件中读取编译记录，并且全部编译
        var cmdTur = util.cmdSplit(filename)
        var cmd = cmdTur[0]
        var value = cmdTur[1]
        if(!cmd || '.' == cmd || util.CmdCheck(cmd, ['all', 'a'], true)){
            middleware.compilerAllByCache(value)
        }else if(util.CmdCheck(cmd, ['list', 'l'], true)){   // 显示所缓存文件目录
            middleware.showCacheCompileList()
        }else if(util.CmdCheck(cmd, ['remove', 'rm'], true)){   // 删除缓存文件
            middleware.delCacheCompile(value)
        }else if(util.CmdCheck(cmd, ['add'], true)){   // 新增编译目标缓存文件
            middleware.addCacheCompile(value)
        }else if(util.CmdCheck(cmd, ['help'], true)){
            console.log(middleware.Doc())
        }else if(util.CmdCheck(cmd, ['?'])){
            console.log(middleware.Doc())
        // 新编译器载入
        }else if(
            (new SuCompiler(middleware))
            .RunNewCompiler(cmd, value)){
        }else{
            middleware.compilerSinglerFile(cmd)
        }
    }
    // 控制台 - 运行器
    middleware.console()
    return middleware    
}