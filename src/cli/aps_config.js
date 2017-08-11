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
        }
        InitConfig(){
            var settingFile = sys.basedir + sys.get('project_config_file')
            if(!fs.existsSync(settingFile) || 'force' == value){
                var json = sys.__P
                // 创建时的时间戳
                json['mtime'] = (new Date).getTime()
                // 私有标记
                json['__private'] = {
                    'v_apjs': sys.Setting.version,
                    'v_publish': sys.Setting.publish
                }
                delete json.project_config_file
                fs.writeFileSync(settingFile, JSON.stringify(json, null, 4))
                this.Show('配置初始化成功')
            }else{
                this.Show('配置已经初始化，无需再次从事化')
            }
        }
        MapCommand(){
            if(!this.cmd) this.Doc()
            if(util.CmdCheck(this.cmd, ['init', 'i'])) this.InitConfig()
            else if(util.CmdCheck(this.cmd, ['get', 'g'])){
                var json = sys.get(value)
            }
            else{
                this.Doc()
            }
        }
        Show(msgArray){
            var msg = ('object' == typeof msgArray)? msgArray.join('\r\n'): msgArray
            console.log(msg)
        }
        Doc(){
            var msg = `${pref}$  --config   --init/i      初始化项目模块`
            console.log(msg)
        }
    }
    return new Config()
 }