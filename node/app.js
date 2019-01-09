const webSocketsServerPort = 1337

const WebSocketServer = require('websocket').server
const http = require('http')

const server = http.createServer(function (request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
})
server.listen(webSocketsServerPort, function () {
  console.log(`listening ${webSocketsServerPort}!`)
})

// create the server
const wsServer = new WebSocketServer({
  httpServer: server
})

let currentConnection

const mouse = require('./mouse.js')
const keyboard = require('./keyboard.js')

// WebSocket server
wsServer.on('request', function (request) {
  const connection = request.accept(null, request.origin)

  if (currentConnection) {
    console.log('bad connection')
    connection.close()
    return
  }

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data)
      console.log('message', data)
      if (data && data.L && data.L.axes !== undefined) {
        mouse.move(data.L.axes)
      }
      if (data && data.R && data.R.axes !== undefined) {
        mouse.scroll(data.R.axes)
      }
      const buttons = { L: {}, R: {}}
      if (data && data.L && data.L.buttons) {
        data.L.buttons.forEach(key => buttons.L[key] = true)
      }
      if (data && data.R && data.R.buttons) {
        data.R.buttons.forEach(key => buttons.R[key] = true)
      }
      mouse.hit(buttons)
      keyboard.hit(buttons)
    }
  })

  connection.on('close', function (connection) {
    currentConnection = undefined
  })

  currentConnection = connection
  console.log('connected', connection.remoteAddress)
})
