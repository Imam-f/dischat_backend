const { Client } = require("pg");
const client = new Client();
client.connect();

const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || "8081"
});

roomlist = [];
let count = 0;

wss.on("connection", socket => {

    socket.on("message", messageFromUser => {

        messageType = JSON.parse(messageFromUser);
        switch (messageType) {
            case "RoomList" :
                // find room
                roomList = roomlist.map((elm) => {
                    return {
                        id : elm.id,
                        name : elm.name,
                        creator : elm.creator,
                        code : elm.code
                    }})
                // new message
                let messageToDispatch = new messageFormat("RoomList",roomList);
                socket.send(messageToDispatch);

            case "RoomMake" :
                let code = makeid();
                count += 1;
                roomList.push(new room(count, messageType.namecreator,
                    messageType.creator, code));                       // new room
                roomlist[roomlist.length - 1]
                    .user.push(new user(
                        messageType.sender.name,
                        messageType.sender.pictureurl == undefined ? messageType.sender.pictureurl : "",
                        socket
                    ));                                                // join
                let messageToDispatch = new messageFormat("EnterRoom",roomList);     // new message
                socket.send(messageToDispatch);

            case "RoomEnter" :
                roomlist.filter((room) => {
                        return room.code == messageType.code;
                    }).user.push(new user(
                        messageType.sender.name,
                        messageType.sender.pictureurl == undefined ? messageType.sender.pictureurl : "",
                        socket
                    ));                                                   // join room
                let messageToDispatch = new messageFormat("EnterRoom","Success");   // make message
                socket.send(messageToDispatch);
            
            case "SendMessage" :
                // make message
                // asign message to room
                // broadcast in room
                // dispatch message
                let messageQueue = new message(MessageType.sender.name,MessageType.payload);
                roomlist.filter((room) => {
                    return room.user.name == messageType.sender.name;
                }).user.foreach((user) => {
                    let messageToBroadcast = new messageFormat("newMessage",messageQueue);
                    user.send(messageToBroadcast);
                });

            default:
                break;
        }
    });
});

// Room Pooling
// use interval to each room
// emptyroom get deleted
    // User Pooling
    // iterate over user
    // dosconnect user removed from room


// Reference https://www.npmjs.com/package/ws

// Constructors
function messageFormat(type, data) {
    this.type = type;
    this.data = data;
    return JSON.stringify(messageFormat);
}
function user(name, pictureurl = "", connection) {
    this.name = name;
    this.pictureurl = pictureurl;
    this.connection = connection;

    return this;
}
function room(id,name,creator,code) {
    this.id = id;
    this.name = name;
    this.creator = creator;
    this.code = code;
    this.message = [];
    this.user = [];

    return this;
}
function message(sender, text) {
    this.sender = sender;
    this.text = text;
    this.time = new Date();

    return this;
}

// ID generator
function makeid() {
    let length = 9;
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
   return result;
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