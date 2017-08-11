#!/usr/bin/env node
/**
 * apsjs 主入口函数
 * 2017年8月9日 星期三
 * Joshua Conero
 */
//Router = require('../cli-router/router')
const Router = require('apsjs-cli-router')


// 编译器
const compiler = require('./aps_compile')
const apsConf = require('./aps_config')

const sys = require('./sysconfig')
const util = require('./util')
const Setting = sys.Setting
// console.log(process.argv, process.argv.length)
// console.log(router)

router = new Router()
router.EmptyCommandPlus = function(pref){
    console.log(pref + `---------------------`)
    console.log(pref + `* ${Setting.name}-v${Setting.version}/${Setting.publish}`)
    console.log(pref + `* Don't push we down <<${util.getdate()}`)
}
router.NotFind = function(cmd){
    var cmdStr = '欢饮使用 apsjs ' + (new Date()) + '， write by Joshua Conero and have a good night'
    router.CommandFormat(cmdStr)
    router.CommandFormat(cmd + ' 命令时候不存在！')
    //router.CommandFormat()    
}

// router.Action();
// 自定义命令
router.Option(['b','build'], function(){
        var filename = router.argv.length > 0? router.argv[0]:null
        if(!filename) router.CommandFormat('没有指定文件名，编译无效', null, true)
        else{
            var h2j = compiler.Html2Js(filename, router.showpref)
            var msg = h2j.message()
            if(msg) router.CommandFormat(msg)
        }
    }
    ,'编译 HTML 2 js')
    .Option(['c', 'config'], function(){        
        //var settingFile = sys.basedir + sys.get('project_config_file')
        //console.log(settingFile)
        apsConf.C(router.argv, router.showpref)
        //console.log(router.CmdDir)
    }
    ,'设置项')

// 默认函数
router.Option(['v', 'version'], 'v '+ Setting.version, '版本信息')
    .Option(['n', 'name'], Setting.name, '名称')    
    .Option(['a', 'author'], Setting.author, '作者') 
    .Run()

// console.log(process.argv)
// console.log(router.CmdDir)
// console.log(router._docStackArray)

// console.log(router.handlerStack)