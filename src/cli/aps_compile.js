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
     * @param {bool} rootCompileMk 根目录标识
     * @return {array} (content/string, msg/string)
     */
    middleware.compiler = function(fname, rootCompileMk){
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
                        case 'import':
                            var ccArr = middleware.compiler(apsjs.getAttr('file'))
                            if(ccArr[0]){
                                //jsStrStack.push(ccArr[0])
                                jsContent += ccArr[0]
                            }
                            isContinue = true
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
                if(rootCompileMk) jsContent = `function ConeroCompilerFunction(d){ return '${jsContent}';}`
                truple[0] = jsContent
                truple[1] = `${filename} 文件已经成编译`            
            }
            if(jsContent){
                if(rootCompileMk) jsContent = `function ConeroCompilerFunction(d){ return '${jsContent}';}`
                truple[0] = jsContent
                truple[1] = `${filename} 文件已经成编译`   
            }
            else{
                truple[1] = `${filename} 文件已经编译失败`
            }          
        }else{
            truple[1] = `${filename} 文件不存在`            
        }
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
        }else{
            middleware.compilerSinglerFile(cmd)
        }
    }
    // 控制台 - 运行器
    middleware.console()
    return middleware    
}