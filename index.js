const ROOM_ID = 921248 // NOTE: your roomid here

const CONF_URL = "https://api.live.bilibili.com/room/v1/Danmu/getConf"
const INIT_URL = "https://api.live.bilibili.com/room/v1/Room/room_init"
const https = require("https")
const querystring = require("querystring")
const ws = require("nodejs-websocket")
const zlib = require("zlib")
const inputSim = require("./input-sim")

var commandMap = require("./command-map").getCommandMap()

var HEADER_SIZE = 16;

function handleBinaryStream (inStream) {
    var data = Buffer.alloc(0);
    inStream.on("readable", function () {
        var newData = inStream.read();
        if (newData) {
            data = Buffer.concat([data, newData]);
        }
    })
    inStream.on("end", function () {
        //console.log("Received " + data.length + "bytes of binary")
        handleData(data);
    })
}

function handleData (buffer) {
    while (buffer.length > 0) {
        var packSize = buffer.readInt32BE();
        var headerSize = buffer.readInt16BE(4);
        var protocolVer = buffer.readInt16BE(6);
        var op = buffer.readInt32BE(8);
        var seq = buffer.readInt32BE(12);
        var data = buffer.slice(headerSize, packSize);
        if (protocolVer == 2) {
            zlib.unzip(data, (err, buf) => {
                if (err) console.error("zlib error: " + err);
                handleData(buf)
            })
        } else {
            switch (op) {
            case 5:
                handleCommand(data.toString('utf-8'));
                break;
            }
        }
        buffer = buffer.slice(packSize)
    }
}

https.get(CONF_URL, (response) => {
    let data = '';
    response.on('data', (chunk) => data += chunk);
    response.on('end', () => {
        handleConfiguration(JSON.parse(data))
    })
});

function handleCommand (buffer) {
    var data = JSON.parse(buffer)
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

var authToken;
var hostServerList;
var roomid;

function handleConfiguration (conf) {
    authToken = conf.data.token;
    hostServerList = conf.data.host_server_list;
    console.log("token: " + authToken)
    https.get(INIT_URL + "?" + querystring.stringify({ id: ROOM_ID }), (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            var res = JSON.parse(data);
            roomid = res.data.room_id;
            tryConnect()
        })
    });
}

tryConnect = (() => {
    var retryCount = 0;
    return function () {
        var server = hostServerList[retryCount % hostServerList.length]
        retryCount += 1
        var uri = `wss://${server.host}:${server.wss_port}/sub`;
        console.log(`trying to connect ${uri} with room id ${roomid}`);
        var conn = ws.connect("wss://tx-bj-live-comet-02.chat.bilibili.com:443/sub", function () {
            var intervalId = setInterval(function () {
                sendPacket(2, {}); // heartbeat
            }, 30 * 1000);

            // auth
            sendPacket(7, {
                "uid": 0,
                "roomid": roomid,
                "protover": 2,
                "platform": "web",
                "clientver": "1.8.2",
                "type": 2,
                "key": authToken 
            }, () => console.log("connected"));

            conn.on("error", (err) => {
                console.log(err);
                //process.exit();
                clearInterval(intervalId)
                tryConnect();
            });
        })

        conn.on("binary", handleBinaryStream);
        conn.on("close", function (code, reason) {
            console.log(`closed. code: ${code}\nreason: ${reason}`);
        })

        function sendPacket (op, data, callback = null) {
            var chunk = Buffer.from(JSON.stringify(data), 'utf-8');
            var header = Buffer.alloc(HEADER_SIZE);
            header.writeInt32BE(chunk.length + HEADER_SIZE/*whole size*/);
            header.writeInt16BE(HEADER_SIZE/*header size*/, 4);
            header.writeInt16BE(1/* protocol version */, 6);
            header.writeInt32BE(op, 8);
            header.writeInt32BE(1/* sequence*/, 12);
            conn.send(Buffer.concat([header, chunk]), callback);
        }
    }
})()
