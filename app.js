'use strict'

var Koa = require('koa')
var path = require('path')
var wechat = require('./wechat/g')
var util = require('./libs/util')
var config = require('./config')
var weixin = require('./weixin')
var wechat_file = path.join(__dirname,'./config/wechat.txt')


var app = new Koa()

/*app.use(function *(next) {
  console.log(this.query)

  var token = config.wechat.token;
  var signature = this.query.signature
  var nonce = this.query.nonce
  var timestamp = this.query.timestamp
  var echostr = this.query.echostr

  var str = [token, timestamp, nonce].sort().join('')
  var sha = sha1(str)

  if( sha === signature ){
    this.body = echostr + ''
  }else{
    this.body = 'wrong'
  }
})*/

app.use(wechat(config.wechat, weixin.reply))

app.listen(process.env.PORT||443)
console.log('Listening: 443')
