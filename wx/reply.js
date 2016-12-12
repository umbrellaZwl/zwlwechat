'use strict'

var path = require('path')
var config = require('../config')
var Wechat = require('../wechat/wechat')
var menu = require('./menu')
var wechatApi = new Wechat(config.wechat)

wechatApi.deleteMenu().then(function(){
  return wechatApi.createMenu(menu)
})
.then(function(msg){
  console.log(msg)
})

exports.reply = function* (next){
  var message = this.weixin

  if(message.MsgType === 'event'){
    if(message.Event === 'subscribe'){
      if(message.EventKey){
        console.log('扫描二维码进来：'+message.EventKey + ' '+ message.Ticket)
      }

      this.body = '哈哈，你订阅了这个号'
    }
    else if(message.Event === 'unsubscribe'){
      console.log('无情取关')
      this.body = ''
    }
    else if(message.Event === 'LOCATION'){
      this.body = "您上报的位置是：" + message.latitude + "/" + message.longitude + "-" + message.Precision
    }
    else if(message.Event === 'CLICK'){
      this.body = '您点击了菜单：'+message.EventKey
    }
    else if(message.Event === 'SCAN'){
      console.log('关注后扫二维码'+message.EventKey+' '+message.Ticket)

      this.body = '看到你扫了一下哦'
    }
    else if(message.Event === 'VIEW'){
      this.body = '您点击了菜单中的链接：'+message.EventKey
    }
    else if(message.Event === 'scancode_push'){
      console.log(message.ScanCodeInfo.ScanType)
      console.log(message.ScanCodeInfo.ScanResult)
      this.body = '您点击了菜单中：'+message.EventKey
    }
    else if(message.Event === 'scancode_waitmsg'){
      console.log(message.ScanCodeInfo.ScanType)
      console.log(message.ScanCodeInfo.ScanResult)
      this.body = '您点击了菜单中：'+message.EventKey
    }
    else if(message.Event === 'pic_sysphoto'){
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      this.body = '您点击了菜单中：'+message.EventKey
    }
    else if(message.Event === 'pic_photo_or_album'){
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      this.body = '您点击了菜单中：'+message.EventKey
    }
    else if(message.Event === 'pic_weixin'){
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      this.body = '您点击了菜单中：'+message.EventKey
    }
    else if(message.Event === 'location_select'){
      console.log(message.SendLocationInfo.Location_X)
      console.log(message.SendLocationInfo.Location_Y)
      console.log(message.SendLocationInfo.Scale)
      console.log(message.SendLocationInfo.Label)
      console.log(message.SendLocationInfo.Poiname)
      this.body = '您点击了菜单中：'+message.EventKey
    }
  }
  else if(message.MsgType === 'text'){
    var content = message.Content
    var reply = '额，你说的 '+message.Content + '太复杂了'

    if (content === '1') {
      reply = '天下第一吃大米'
    }
    else if (content === '2') {
      reply = '天下第二吃豆腐'
    }
    else if (content === '3') {
      reply = '天下第三吃仙丹'
    }
    else if (content === '4') {
      reply = [
      {
        title: '技术改变世界',
        description: '只是个描述而已',
        picUrl: 'http://res.cloudinary.com/moveha/image/upload/v1441184110/assets/images/Mask-min.png',
        url: 'https://github.com/'
      },{
        title: 'Nodejs 开发微信',
        description: '爽到爆',
        picUrl: 'http://res.cloudinary.com/moveha/image/upload/v1431337192/index-img2_fvzeow.png',
        url: 'https://nodejs.org/'
      }]
    }
    else if (content === '5') {
      var data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../2.jpg'))

      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    }
    else if (content === '6') {
      var data = yield wechatApi.uploadMaterial('video',path.join(__dirname,'../6.mp4'))

      reply = {
        type: 'video',
        title: '回复视频内容',
        description: '打个篮球玩玩',
        mediaId: data.media_id
      }
    }
    else if (content === '7') {
      var data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../2.jpg'))

      reply = {
        type: 'music',
        title: '回复音乐内容',
        description: '放松一下',
        musicUrl: 'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
        thumbMediaId: data.media_id
      }
    }
    else if (content === '8') {
      var data = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../2.jpg'), { type: 'image'})

      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    }
    else if (content === '9') {
      var data = yield wechatApi.uploadMaterial('video',path.join(__dirname,'../6.mp4'), {type: 'video', description: '{"title":"Really a nice place","introduction": "Never think it so easy"}'})

      console.log(data)

      reply = {
        type: 'video',
        title: '回复视频内容',
        description: '打个篮球玩玩',
        mediaId: data.media_id
      }
    }
    else if (content === '10') {
      var picData = yield wechatApi.uploadMaterial('image',path.join(__dirname,'../2.jpg'), {})

      var media = {
        articles: [{
          title: 'tututu',
          thumb_media_id: picData.media_id,
          author: 'Zwl',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '没有内容',
          content_source_url: 'https://github.com'
        },{
          title: 'tututu2',
          thumb_media_id: picData.media_id,
          author: 'Zwl',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '没有内容',
          content_source_url: 'https://github.com'
        }]
      }

      data = yield wechatApi.uploadMaterial('news', media, {})
      data = yield wechatApi.fetchMaterial(data.media_id, 'news', {})

      console.log(data)

      var items = data.news_item
      var news = []

      items.forEach(function(item){
        news.push({
          title: item.title,
          description: item.digest,
          picUrl: picData.url,
          url: item.url
        })
      })

      reply = news
    }
    else if (content === '11') {
      var counts = yield wechatApi.countMaterial()
      console.log(JSON.stringify(counts))

      var results = yield [
        wechatApi.batchMaterial({
          type: 'image',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'video',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'voice',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'news',
          offset: 0,
          count: 10
        })
      ]

      console.log(results)

      reply = '1'
    }
    else if (content === '13') {
      var user = yield wechatApi.fetchUsers(message.FromUserName,'en')
      console.log(user)

      var openIds = [
        {
          openid: message.FromUserName,
          lang: 'en'
        }
      ]

      var users = yield wechatApi.fetchUsers(openIds)
      console.log(users)
      reply = JSON.stringify(user)
    }
    else if (content === '14') {
      var users = yield wechatApi.listUsers()
      console.log(users)
      reply = JSON.stringify(users)
    }

    this.body = reply
  }

  yield next
}
