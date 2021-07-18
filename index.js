const { Client } = require("pg");
const client = new Client();
client.connect();

const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || "8081"
});


roomlist = new Set();
connetionlist = new Set();

wss.on("connection", socket => {

    socket.on("message", message => {

        messageType = JSON.parse(message);
        switch (messageType) {
            case "RoomList" :
                // find room
                roomList = roomlist.map((elm) => {
                    return {
                        id : elm.id,
                        name : elm.name,
                        creator : elm.creator,
                        code : elm.code
                    }
                })
                // new message
                let message = messageFormat("RoomList",roomList);
                socket.send(message);
            case "RoomMake" :
                // make room
                room
                // add roomlist
                // join
                // make message
                socket.send();
            case "RoomEnter" :
                // join room
                // make message
                socket.send();
            case "SendMessage" :
                // make message
                // broadcast in room
                socket.send();
            default:
                break;
        }
        
        socket.send("Hello "+ JSON.parse(message).dttext);
    });
    connetionlist.push(socket);
});

function messageFormat(type, data) {
    this.type = type;
    this.data = data;
    return JSON.stringify(messageFormat);
}
function user() {
    this.name = "";
    this.pictureurl = "";

    return this;
}
function room() {
    this.id = "";
    this.name = "";
    this.creator = "";
    this.code = "";
    this.message = [];

    return this;
}
function message() {
    this.sender = "";
    this.text = "";
    this.time = "";

    return this;
}

// wss.on("close", () => {  })

/*  Example

    setInterval(() => {
        console.log("interval" + connetionlist.length);
        connetionlist[0].send("periodic");
    },3000);


    message
        ask room
        enter room
        send chat
        receive chat
        quit room
*/

/*
  PGUSER=dbuser \
  PGPASSWORD=secretpassword \
  PGHOST=database.server.com \
  PGPORT=3211 \
  PGDATABASE=mydb \
  node script.js
*/