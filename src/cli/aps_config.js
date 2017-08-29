/**
 * apsjs 配置命令程序
 * 2017年8月11日 星期五
 */

 const util = require('./util')
 const sys = require('./sysconfig')
 const fs = require('fs')

 exports.C = (argv, pref) => {
    class Config{
        constructor(){
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
         * 获取用户可保存的配置问价内容
         * @return {JSON}
         */
        GetUserSaveAble(){
            if(!this.UserSaveAbleConf){
                var json = sys.getUserConf()
                // 创建时的时间戳
                json['mtime'] = (new Date).getTime()
                // 私有标记
                json['__private'] = {
                    'v_apjs': sys.Setting.version,
                    'v_publish': sys.Setting.publish
                }
                delete json.project_config_file
                this.UserSaveAbleConf = json
            }            
            return this.UserSaveAbleConf
        }
        /**
         * 初始化项目配置文件
         */
        InitConfig(){
            var settingFile = sys.basedir + sys.get('project_config_file')
            if(!fs.existsSync(settingFile) || 'force' == value){
                var json = this.GetUserSaveAble()
                fs.writeFileSync(settingFile, JSON.stringify(json, null, 4))
                this.Show('配置初始化成功')
            }else{
                this.Show('配置已经初始化，无需再次从事化')
            }
        }
        /**
         * 更新配置文件
         * @param {string|JSON} key
         * @param {any} value
         * @return {boolean}
         */
        UpdateConfig(key, value){
            if(!key) return false
            var json = this.GetUserSaveAble()
            if('object' == typeof key){
                for(var k in key){
                    json[k] = key[k]
                }                
            }
            else{
                if('undefined' == typeof value) return false                
                json[key] = value
            }
            return this.SaveConfigFile(json)
        }
        /**
         * 函数配置现在并保存
         * @param {string|Array} key 
         */
        DelConfig(key){
            var isSucess = false
            var json = this.GetUserSaveAble()
            if('object' == typeof key){
                for(var i=0; i<key.length; i++){
                    var k = key[i]
                    if('undefined' != json[k]){
                        delete json[k];
                        if(!isSucess) isSucess = true
                    }
                }
            }else{
                if('undefined' != json[key]) delete json[key];
                isSucess = true
            }
            if(isSucess) this.SaveConfigFile(json)
            return isSucess
        }
        /**
         * 保存配置文件
         * @param {string|JSON} saveStr
         * @return {boolean}
         */
        SaveConfigFile(saveStr){
            saveStr = 'object' == typeof saveStr? JSON.stringify(saveStr, null, 4) : saveStr.toString()     
            fs.writeFileSync(sys.userConfigPath, saveStr)
            return true
        }
        /**
         * 命令行匹配
         */
        MapCommand(){
            if(!this.cmd) return this.Doc()
            // --init/i
            if(util.CmdCheck(this.cmd, ['init', 'i'])) this.InitConfig()
            // --get/g
            else if(util.CmdCheck(this.cmd, ['get', 'g'])){
                if(this.value){
                    if('..' == this.value){
                        console.log(JSON.stringify(this.GetUserSaveAble(), null, 4))
                        return
                    }                 
                    var __v = sys.get(this.value)
                    if('object' == typeof __v){
                        console.log(__v)
                    }else{
                        this.Show(`${pref}:)  ${this.value}  =>   ${__v}`)
                    }
                    
                }else{
                    this.Show(`${pref}-:)  ${this.value}  =>   未设置此项值`)
                }
            }
            // --set/s
            else if(util.CmdCheck(this.cmd, ['set', 's'])){
                if(this.value){
                    var checkReg = /[\/]{1,}[;]{0,}/
                    if(checkReg.test(this.value)){
                        var keyArr = this.value.split(';')
                        var json = {}
                        var jsonLen = 0
                        for(var i=0; i<keyArr.length; i++){
                            var el = keyArr[i]
                            var k0Idx = el.indexOf('/')
                            var k0 = el.substr(0, k0Idx)
                            var v0 = el.substr(k0Idx + 1)
                            json[k0] = v0
                            jsonLen += 1
                        }
                        if(jsonLen > 0){
                            this.UpdateConfig(json)
                            this.Show(`${pref}-:)  本次共设置${jsonLen}个参数！`)
                        }else{
                            this.Show(`${pref}-:)  ${this.value} 参数无效，配置更新失败！`) 
                        }
                    }
                    else this.Show(`${pref}-:)  ${this.value} 参数无效，配置更新失败！`)
                }
                else{
                    this.Show(`${pref}-:)  配置参数为空，配置更新失败！`)
                }
            }
            // --del/d         
            else if(util.CmdCheck(this.cmd, ['del', 'd'])){
                if(this.value){
                    var keyList = this.value.split(',')
                    if(this.DelConfig(keyList)){
                        this.Show(`${pref}-:) 共 ${keyList.length} 配置删除！`)
                    }
                    else{
                        this.Show(`${pref}-:) ${this.value} 配置删除失败！`)
                    } 
                }
                else{
                    this.Show(`${pref}-:)  配置参数为空，配置删除失败！`)
                }
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
         * 窗口文档
         */
        Doc(){
            
            var msg = `${pref}$  --config   --init/i      初始化项目模块` + 
                      `${pref}$             --get=..      获取系统全部配置` +
                      `${pref}$             --get/g=key   获取config的键值` +
                      `${pref}$             --set/s=k1/v1;k2/v2;...    设置config的键值` + 
                      `${pref}$             --help/?`
            console.log(msg)
        }
    }
    return new Config()
 }