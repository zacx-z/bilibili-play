const ROOM_ID = 921248 // NOTE: your roomid here

const CONF_URL = "https://api.live.bilibili.com/room/v1/Danmu/getConf"
const INIT_URL = "https://api.live.bilibili.com/room/v1/Room/room_init"
const https = require("https")
const querystring = require("querystring")
const ws = require("nodejs-websocket")
const zlib = require("zlib")
const inputSim = require("./input-sim")

var commandMap = require("./command-map").getCommandMap()

const bmi = require("./bmi.js")

const client = bmi.connect(ROOM_ID)
client.on('command', handleCommand)

function handleCommand (data) {
    switch (data.cmd) {
    case "DANMU_MSG":
        var text = data.info[1]
        console.log(data.info[2][1] + ':' + text)
        var cmd = text.toLowerCase();
        if (commandMap[cmd] != null) {
            var info = commandMap[cmd]
            inputSim.SendKey(info.keyCode, info.duration)
        }
        break;
    }
}
