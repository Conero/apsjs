/**
 * 系统配置页面， 用户配置文件可以继承改配置项，自动分析很加载用户信息
 * 2017年8月11日 星期五
 */
const fs = require('fs')
const path = require('path')
const util = require('./util')


const CmdDir = process.cwd()
const __P = {
    cache_root_dir : '.apsjs',                 // 缓存顶层文件目录
    project_config_file: 'config.json',          // 项目配置文件
    cache_compiler_file: 'compiler.json',          // 编译记录
    
    compiler_tpl_ext: '.html',           // 编译器后缀名
    compiler_point_clear: true,           // 编译器模板清除点操作符为方扩展 -> 
    compiled_tpl_ext: '.c.js'           // 编译器后缀名
}
const basedir = CmdDir + '/' + __P.cache_root_dir + '/'
const projectDir = path.dirname(__filename)
const Setting = require(projectDir.replace(/\\/g,'/').replace('/src/cli', '') + '/package.json')
/**
 * @param {string|null} key 键值
 * @return {*}
 */
function getUserConfig(key){
    var config = {}
    var filename = basedir + __P.project_config_file
    if(fs.existsSync(filename)){
        config = require(filename)
    }
    if(key) return config[key] || ''
    return config
}
/**
 * 获取系统参数值, 通过键值获取
 * @return {any}
 */
exports.getUserConfigByKey = getUserConfig
/**
 * 获取用户json的全部值
 * @return {JSON}
 */
exports.getUserConf = () =>{
    var newJson = {}
    if(fs.existsSync(this.userConfigPath)){
        newJson = require(this.userConfigPath)
    }
    return newJson
}
/**
 * 系统默认常量
 */
exports.__P = __P

exports.basedir = basedir
/**
 * 系统配置
 */
exports.Setting = Setting

/**
 * 用户私用配置文件路径
 */
exports.userConfigPath = basedir + __P.project_config_file

/**
 * 获取配置项，先检测用户配置，在从系统配置获取
 * @param {string} key
 * @param {*} def
 * @return {string|null}
 */
exports.get = (key, def) =>{
    var value = getUserConfig(key)
    value = value || __P[key] || def || null
    return value
}
/**
 * 配置初始化
 */
exports.init = () =>{
    // 基础目录生成
    if(!fs.existsSync(basedir)) fs.mkdirSync(basedir)
}
/**
 * 编译器相关的配置文件
 * @return {object}
 */
exports.compiler = (filename) =>{
    var parent = this
    var JsonInfoCache = null
    class C{
        constructor(){
            parent.init()
            this.key = filename? util.base64_encode(filename):null
            this.cache_file = basedir + parent.get('cache_compiler_file')
            this.count = 0          // 编译统计，用于编译版本号自动递增
        }
        /**
         * 设置文件名
         * @param {string} fname 
         * @return {object}
         */
        setFileName(fname){
            filename = fname
            this.key = util.base64_encode(filename)
            return this
        }
        /**
         * 缓存文件
         * @param {json} config 
         * @param {bool} recover 是否覆盖配置，用于当key为空时 
         */
        cache(config, recover){
            var json
            if(!recover){
                json = this.getJsonInfo()
                json[this.key] = config
            }else{
                json = config
            }
            // 格式化输出文件
            fs.writeFileSync(this.cache_file, JSON.stringify(json, null, 4))
            JsonInfoCache = json
        }
        /**
         * 自动更新编译信息
         */
        updateInfo(){
            var json = this.getJsonInfo(this.key)
            // 编译次数
            json['compile_count'] = (json['compile_count'] || 0) + 1
            this.count = json['compile_count']
            // 编译日期
            // json['compile_time'] = util.getdate()        // 文件新建时无效
            json['compile_time'] = new Date()        
            // 编译命令
            if(!json['cmd']) json['cmd'] = filename
            this.cache(json)
        }
        /**
         * 获取编译信息
         * @param {string|null} key 
         */
        getJsonInfo(key){
            if(!JsonInfoCache){
                try{
                    JsonInfoCache = fs.existsSync(this.cache_file)? require(this.cache_file):{}
                }catch(e){
                    // 非法数组时清空缓存文件
                    if(fs.existsSync(this.cache_file)){
                        fs.unlinkSync(this.cache_file)                        
                    }
                    JsonInfoCache = {}
                }
            }
            return key? (JsonInfoCache[key] || {}):JsonInfoCache
        }
    }
    return new C()
}