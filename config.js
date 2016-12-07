'use strict'

var path = require('path')
var util = require('./libs/util')
var wechat_file = path.join(__dirname,'./config/wechat.txt')
var config = {
  wechat: {
    appID: 'wxd5b9575d13f25dbd',
    appSecret: '617440a97ab360a9af7d7abadcda1ef5',
    token: 'zwlwechat',
    getAccessToken: function(){
      return util.readFileAsync(wechat_file)
    },
    saveAccessToken: function(data){
      data = JSON.stringify(data)
      return util.writeFileAsync(wechat_file, data)
    }
  }
}

module.exports = config
