/**
 * 编译器
 * 2017年8月9日 星期三
 * Joshua Conero
 */

 const fs = require('fs')
 const path = require('path')


 /**
  * HTML编辑器
  * @param {string} filename 文件名
  * @return {object} middleware
  */
exports.Html2Js = (filename) => {
    var __msg
    // js 脚本
    var __jsStr = ''
    var middleware = {}
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
    // 编译进行
    middleware.console = function(){
        if(!fs.existsSync(filename) && filename.lastIndexOf('.html') < 0) filename += '.html'
        if(fs.existsSync(filename)){
            var bf = fs.readFileSync(filename)
            var lines = bf.toString().split('\n')
            var jsStrStack = []
            var reg = /\{\{[\da-zA-Z\s\$\.\_]*\}\}/g
            for(var i=0; i<lines.length; i++){
                // 行脚本处理
                var line = lines[i]
                if(!line) continue
                // <!--注释行检测-->
                if(line.indexOf('<!--') > -1 && line.indexOf('-->') > -1) continue
                line = line.trim()   
                if(!line) continue
                var vs = line.match(reg)     
                if(vs){
                    for(var j=0; j<vs.length; j++){
                        var raw = vs[j]
                        var v = raw.replace(/(\{\{)|(\}\})/g, '').trim()
                        // d.k => d['k']
                        v = middleware.point2v(v)
                        line = line.replace(raw, `'+ ${v} +'`)
                    }
                }        
                jsStrStack.push(`'${line}'`)
            }
            if(jsStrStack.length > 0){
                // 生成脚本处理
                __jsStr = jsStrStack.join(' + ')                
                __jsStr = `// ${new Date()} \r\n`
                    + `function ConeroCompilerFunction(d){ return ${__jsStr};}`
                var newjs = path.dirname(filename) + '/' + path.basename(filename).replace(path.extname(filename), '.c.js')
                fs.writeFileSync(newjs, __jsStr)
                __msg = `${filename} 文件已经成编译为 ${newjs}`
            }else{
                __msg = `${filename} 文件已经编译失败`
            }
        }else{
            __msg = `${filename} 文件不存在`
        }
    }
    // 控制台 - 运行器
    middleware.console()
    return middleware    
}