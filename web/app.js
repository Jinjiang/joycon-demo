/**
 * @fileOverview
 * 1. keep listening for connections from joy-cons
 * 2. keep connection to the Node app through websocket
 * 3. raf to check the update of the buttons and then send signals to Node app through websocket
 */




/**
 * listen connect/disconnect gamepad
 *   recognize gamepad type
 *   update connecting gamepad list
 *
 * state { joyCons }
 * on-connect()
 * on-disconnect()
 */
function keepConn2JoyCons () {
  const joyCons = {}
  function onConnect (event) {
    const { gamepad } = event
    const side = getJoyConSide(gamepad.id)
    if (side) {
      const index = gamepad.index
      Object.defineProperty(joyCons, side, {
        get () {
          return navigator.getGamepads()[index]
        }
      })
    }
    console.log('connected', side, gamepad)
  }
  function onDisconnect (e) {
    const { gamepad } = event
    const side = getJoyConSide(gamepad.id)
    if (side) {
      delete joyCons[side]
    }
    console.log('disconnected', side, gamepad)
  }

  function getJoyConSide (id) {
    if (id.match(/^Joy-Con \(L\)/)) {
      return 'L'
    }
    if (id.match(/^Joy-Con \(R\)/)) {
      return 'R'
    }
  }

  self.addEventListener('gamepadconnected', onConnect)
  self.addEventListener('gamepaddisconnected', onDisconnect)
  self.joyCons = joyCons
}




/**
 * connect to Node app
 * if connection created successfully
 *   update connection state
 *   listen disconnect event
 *     update connection state
 *     go to connect again in 3 seconds
 * else
 *   go to connect again in 3 seconds
 *
 * config { host, port }
 * state { state, current, next request }
 * connect()
 * on-connect()
 * on-disconnect()
 * send(msg)
 *
 * msg
 *   type: 'press' | 'release' | 'click' | 'longpress' | 'move'
 *   key: String
 *   value: { x, y, angle, length }
 */
function keepConn2NodeApp () {

  connect()

  function connect () {
    const connection = new WebSocket('ws://127.0.0.1:1337')
    connection.onopen = connected
    connection.onclose = reconnect

    function connected () {
      window.connection = connection
      console.log('Connection created.')
    }

    function reconnect () {
      window.connection = null
      console.log('Connection failed or lost. Will reconnect in 3 seconds.')
      setTimeout(connect, 3000)
    }
  }

  window.connection = null
  console.log('connect')
}




/**
 * axesMap
 * buttonMap
 */
function initData () {
  const axesMap = generateAxeMap()
  const buttonMap = {
    L: {
      0: 'left',
      1: 'down',
      2: 'up',
      3: 'right',
      4: 'SL',
      5: 'SR',
      8: 'minus',
      10: 'axes',
      13: 'screenshot',
      14: 'L',
      15: 'ZL'
    },
    R: {
      0: 'A',
      1: 'X',
      2: 'B',
      3: 'Y',
      4: 'SL',
      5: 'SR',
      9: 'plus',
      11: 'axes',
      12: 'home',
      14: 'R',
      15: 'ZR'
    }
  }

  function generateAxeMap () {
    const degList = [undefined, 45, 90, 135, 180, 225, 270, 315, 0]
    const map = {}
    for (let i = 0; i < 9; i++) {
      const num = 1 - (i - 1) * 2 / 7
      const key = num.toString().slice(0, 5)
      map[key] = degList[i]
    }
    return map
  }

  self.axesMap = axesMap
  self.buttonMap = buttonMap
}




/**
 * get all buttons
 * ~diff~
 * ~record changes and timestamp for each of them~
 * send to Node app
 */
function checkUpdate () {
  const state = getState()
  if (connection && state) {
    connection.send(JSON.stringify(state))
  }
}




/**
 * Joy-Con (L)
 * 0.4285714626312256  0.7142857313156128  1
 * 0.14285719394683838 1.2857143878936768  -1
 * -0.1428571343421936 -0.4285714030265808 -0.7142857313156128
 *
 * 1-4/7  1-2/7  1-0/7
 * 1-6/7  1+2/7  1-14/7
 * 1-8/7  1-10/7 1-12/7
 *
 * Joy-Con (L)
 * 0  - left
 * 1  - down
 * 2  - up
 * 3  - right
 * 4  - SL
 * 5  - SR
 * 6  -
 * 7  -
 * 8  - minus
 * 9  -
 * 10 -
 * 11 -
 * 12 -
 * 13 - screenshot
 * 14 - L
 * 15 - ZL
 * 16 -
 *
 * Joy-Con (R)
 * 0  - A
 * 1  - X
 * 2  - B
 * 3  - Y
 * 4  - SL
 * 5  - SR
 * 6  -
 * 7  -
 * 8  -
 * 9  - plus
 * 10 -
 * 11 -
 * 12 - home
 * 13 -
 * 14 - R
 * 15 - ZR
 * 16 -
 */
function getState () {
  const L = getSideState('L')
  const R = getSideState('R')

  if (!L && !R) {
    return
  }

  const result = {}

  if (L) {
    result.L = L
  }
  if (R) {
    result.R = R
  }

  return result

  function getSideState (side) {
    const gamepad = joyCons[side]
    if (gamepad) {
      const result = {}
      const { axes, buttons } = gamepad
      const axesResult = axesMap[gamepad.axes[9].toString().slice(0, 5)]
      const buttonsResult = gamepad.buttons
        .map((btn, index) => ({
          key: buttonMap[side][index],
          pressed: btn.pressed
        }))
        .filter(({ pressed }) => pressed)
        .map(info => info.key)
      if (axesResult === undefined && buttonsResult.length === 0) {
        return
      }
      if (axesResult !== undefined) {
        result.axes = axesResult
      }
      if (buttonsResult.length > 0) {
        result.buttons = buttonsResult
      }
      return result
    }
  }
}




function rafUpdate () {
  checkUpdate()
  setTimeout(rafUpdate)
}

initData()
keepConn2JoyCons()
keepConn2NodeApp()
rafUpdate()
