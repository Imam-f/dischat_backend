const { Client } = require("pg");
const client = new Client();
client.connect();

const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || "8081"
});


roomlist = new Map();
connetionlist = new Map();

wss.on("connection", socket => {

    socket.on("message", message => {

        messageType = JSON.parse(message);
        switch (messageType) {
            case "RoomList" :
                // find room
                // new message
                socket.send();
            case "RoomMake" :
                // make room
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

// function user() {
//     this.name = "";
//     this.picture = "";
// }
// function room() {
//     this.name = "";
//     this.id = "";
//     this.message = {};
// }

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