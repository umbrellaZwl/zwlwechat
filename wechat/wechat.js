'use strict'

var Promise = require('bluebird')
var _ = require('lodash')
var request = Promise.promisify(require('request'))
var util = require('./util')
var fs = require('fs')
var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
  accessToken: prefix+'token?grant_type=client_credential',
  temporary: {
    upload: prefix+'media/upload?',
    fetch: prefix+'media/get?'
  },
  permanent: {
    upload: prefix + 'material/add_material?',
    fetch: prefix + 'material/get_material?',
    uploadNews: prefix + 'material/add_news?',
    uploadNewsPic: prefix + 'material/uploadimg?',
    del: prefix + 'material/del_material?',
    update: prefix + 'material/update_news?',
    count: prefix + 'material/get_materialcount?',
    batch: prefix + 'material/batchget_material?'
  },
  user: {
    remark: prefix + 'user/info/updateremark?',
    fetch: prefix + 'user/info?',
    batchFetch: prefix + 'user/info/batchget?',
    list: prefix + 'user/get?'
  },
  mass: {
    sendAll: prefix + 'message/mass/sendall?'
  },
  menu: {
    create: prefix + 'menu/create?',
    get: prefix + 'menu/get?',
    del: prefix + 'menu/delete?',
    current: prefix + 'get_current_selfmenu_info?',
  },
  ticket: {
    get: prefix + 'ticket/getticket?'
  }
}

function Wechat(opts){
  var that = this
  this.appID = opts.appID
  this.appSecret = opts.appSecret
  this.getAccessToken = opts.getAccessToken
  this.saveAccessToken = opts.saveAccessToken
  this.getTicket = opts.getTicket
  this.saveTicket = opts.saveTicket

  this.fetchAccessToken()
  //this.uploadMaterial('image',__dirname+'/2.jpg')
}

Wechat.prototype.fetchAccessToken = function(){
  var that = this
  if (this.access_token && this.expires_in) {
    if (this.isVaildAccessToken(this)) {
      console.log(this)
      return Promise.resolve(this)
    }
  }

  return new Promise(function(resolve, reject){
    that.getAccessToken()
    .then(function(data) {
      try {
        data = JSON.parse(data)
      }
      catch(e){
        return that.updateAccessToken(data)
      }

      if( that.isVaildAccessToken(data) ){
        return Promise.resolve(data)
      }else{
        return that.updateAccessToken(data)
      }
    })
    .then(function(data){

      that.saveAccessToken(data)
      resolve(data)
    })
  })

}

Wechat.prototype.fetchTicket = function(access_token){
  var that = this

  return new Promise(function(resolve, reject){
    that.getTicket()
    .then(function(data) {
      try {
        data = JSON.parse(data)
      }
      catch(e){
        return that.updateTicket(access_token)
      }

      if( that.isVaildTicket(data) ){
        return Promise.resolve(data)
      }else{
        return that.updateTicket(access_token)
      }
    })
    .then(function(data){

      that.saveTicket(data)
      resolve(data)
    })
  })

}

Wechat.prototype.updateTicket = function(access_token){
  var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi'

  return new Promise(function(resolve, reject){
    request({url: url, json: true}).then(function(response){
      var data = response[1]
      var now = (new Date().getTime())
      var expires_in = now + (data.expires_in - 20) * 1000

      data.expires_in = expires_in
      resolve(data)
    })
  })
}

Wechat.prototype.isVaildTicket = function(data){
  if( !data || !data.ticket || data.expires_in ){
    return false
  }

  var ticket = data.ticket
  var expires_in = data.expires_in
  var now = (new Date().getTime())

  if( ticket && now < expires_in ){
    return true
  }else{
    return false
  }
}

Wechat.prototype.isVaildAccessToken = function(data){
  if( !data || !data.access_token || data.expires_in ){
    return false
  }

  var access_token = data.access_token
  var expires_in = data.expires_in
  var now = (new Date().getTime())

  if( now < expires_in ){
    return true
  }else{
    return false
  }
}

Wechat.prototype.updateAccessToken = function(data){
  var appID = this.appID
  var appSecret = this.appSecret
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret

  return new Promise(function(resolve, reject){
    request({url: url, json: true}).then(function(response){
      var data = response[1]
      var now = (new Date().getTime())
      var expires_in = now + (data.expires_in - 20) * 1000

      data.expires_in = expires_in
      resolve(data)
    })
  })
}

Wechat.prototype.reply = function(){
  var content = this.body
  var message = this.weixin
  var xml = util.tpl(content, message)

  this.status = 200
  this.type = 'application/xml'
  this.body = xml
}

Wechat.prototype.uploadMaterial = function(type,material,permanent){
  var that = this
  var form = {}
  var uploadUrl = api.temporary.upload

  if (permanent) {
    uploadUrl = api.permanent.upload

    _.extend(form, permanent)
  }

  if (type === 'pic') {
    uploadUrl = api.permanent.uploadNewsPic

  }

  if (type === 'news') {
    uploadUrl = api.permanent.uploadNews
    form = material
  }
  else {
    form.media = fs.createReadStream(material)
  }

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = uploadUrl + '&access_token=' + data.access_token

        if(!permanent) {
          url += '&type=' + type
        }
        else {
          form.access_token = data.access_token
        }

        var options = {
          method: 'POST',
          url: url,
          json: true
        }

        if (type === 'news') {
          options.body = form
        }
        else {
          options.formData = form
        }

        request(options).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('Upload material fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.fetchMaterial = function(mediaId, type, permanent){
  var that = this
  var form = {}
  var fetchUrl = api.temporary.fetch

  if (permanent) {
    fetchUrl = api.permanent.fetch
  }

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = fetchUrl + '&access_token=' + data.access_token

        var options = {method: 'POST', url: url, body: form, json: true}

        var form = {
          media_id: mediaId,
          access_token: data.access_token
        }

        if (permanent) {
          form.media_id = mediaId,
          form.access_token = data.access_token
          options.body = form
        }else{
          if (type === 'video') {
            url = url.replace('https://','http://')
          }
          url += '&media_id=' + mediaId
        }

        if (type === 'news' || type === 'video') {
          request(options).then(function(response){
            var _data = response[1]

            if (_data) {
              resolve(_data)
            }
            else {
              throw new Error('fetch material fails')
            }
          })
          .catch(function(err){
            reject(err)
          })
        }
        else {
          resolve(url)
        }
      })

  })
}

Wechat.prototype.deleteMaterial = function(mediaId){
  var that = this
  var form = {
    media_id: mediaId
  }

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.permanent.del + '&access_token=' + data.access_token + '&media_id=' + mediaId

        request({method: 'POST', url: url, body: form, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('Delete material fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.updateMaterial = function(mediaId, news){
  var that = this
  var form = {
    media_id: mediaId
  }

  _.extend(form, news)

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.permanent.update + '&access_token=' + data.access_token + '&media_id=' + mediaId

        request({method: 'POST', url: url, body: form, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('Update material fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.countMaterial = function(){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.permanent.count + '&access_token=' + data.access_token

        request({method: 'GET', url: url, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('Count material fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.batchMaterial = function(options){
  var that = this

  options.type = options.type || 'image'
  options.offset = options.offset || 0
  options.count = options.count || 1

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.permanent.batch + '&access_token=' + data.access_token

        request({method: 'POST', url: url, body: options, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('Batch material fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.remarkUser = function(openId,remark){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.user.remark + '&access_token=' + data.access_token

        var form = {
          openid: openId,
          remark: remark
        }
        request({method: 'POST', url: url, body: form, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('remark user fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.fetchUsers = function(openIds, lang){
  var that = this
  var lang = lang || 'zh_CN'
  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url
        var form
        var options = {
          json: true
        }

        if (_.isArray(openIds)) {
          options.url = api.user.batchFetch + 'access_token=' + data.access_token
          form = {
            user_list: openIds
          }
          options.method = 'POST'
          options.body = form
        }
        else {
          options.method = 'GET'
          options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid='+ openIds +'&lang=' + lang
        }

        request(options).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('batchFetch user fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.listUsers = function(openId){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.user.list + 'access_token=' + data.access_token

        if (openId) {
          url += '&next_openid=' + openId
        }

        request({method: 'GET', url: url, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('list user fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.createMenu = function(menu){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.menu.create + 'access_token=' + data.access_token

        request({method: 'POST', url: url, body: menu, json: true}).then(function(response){
          var _data = response[1]

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('create menu fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.getMenu = function(menu){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.menu.get + 'access_token=' + data.access_token

        request({url: url, json: true}).then(function(response){
          var _data = response[1]

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('get menu fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.deleteMenu = function(){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.menu.del + 'access_token=' + data.access_token

        request({url: url, json: true}).then(function(response){
          var _data = response[1]

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('del menu fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

Wechat.prototype.getCurrentMenu = function(){
  var that = this

  return new Promise(function(resolve, reject){
    that
      .fetchAccessToken()
      .then(function(data){
        var url = api.menu.current + 'access_token=' + data.access_token

        request({url: url, json: true}).then(function(response){
          var _data = response[1]
          console.log(_data)

          if (_data) {
            resolve(_data)
          }
          else {
            throw new Error('get current menu fails')
          }
        })
        .catch(function(err){
          reject(err)
        })
      })

  })
}

module.exports = Wechat
