const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || 8081
});
console.log("Listening on",process.env.PORT);

var roomlist = [];
var roomcheckmutex = false;
for(i = 0; i < 1 + Math.random() * 10 ;i++) {
    let roomid = generateUniqueRoomId();
    roomlist.push(new room(
        roomid,
        "Anything",
        "Origin",
        makeid()
    ));
}
console.log(roomlist);


// Room Pooling
// use interval to each room
setInterval(() => {
    console.log("Room");

    while(roomcheckmutex) {}
    roomcheckmutex = true;
    roomlist = roomlist.filter((room) => {
        return (room.user.length > 0) || (room.message.length > 0);
    })
    
    roomcheckmutex = false;
    // console.log(roomlist);
}, 10000);


wss.on("connection", socket => {

    socket.on("message", messageFromUser => {
        while(roomcheckmutex) {}
        let messageReceived = JSON.parse(messageFromUser);
        let messageType = messageReceived.type;

        switch (messageType) {

            case "RoomList" :
                let roomlst = roomlist.map((elm) => {
                    return {
                        id : elm.id,
                        name : elm.name,
                        creator : elm.creator,
                        code : elm.code
                    }
                });
                // roomlst[0].creator = (new Date()).toString();
                let messageToDispatch = messageFormat("RoomList",roomlst);
                
                socket.send(messageToDispatch);
                break;

            case "RoomMake" :
                let roomid = generateUniqueRoomId();
                let code = makeid();
                
                roomlist.push(new room(roomid, messageReceived.payload.name,
                    messageReceived.payload.creator, code));                       // new room
                roomlist[roomlist.length - 1]
                    .user.push(new user(
                        messageReceived.sender.name,
                        messageReceived.sender.pictureurl == undefined ? messageReceived.sender.pictureurl : "",
                        socket
                    ));                                                             // join
                let broadcastRoom = {
                    id : roomlist[roomlist.length-1].id,
                    name : roomlist[roomlist.length-1].name,
                    creator : roomlist[roomlist.length-1].creator,
                    code : roomlist[roomlist.length-1].code
                };
                
                let mssageToDispatch = messageFormat("MakeRoom", broadcastRoom);        // new message
                socket.send(mssageToDispatch);
                break;

            case "RoomEnter" :
                let roomselected = roomlist.filter((room) => {
                        return room.code === messageReceived.payload.code 
                            && room.id === messageReceived.payload.id;
                    });
                if(roomselected.length == 0) {
                    let roomid = generateUniqueRoomId();
                    roomlist.push(new room(roomid, messageType.payload.name,
                        messageType.payload.creator, messageReceived.payload.code));                            // new room
                    roomlist[roomlist.length - 1]
                        .user.push(new user(
                            messageType.sender.name,
                            messageType.sender.pictureurl == undefined ? messageType.sender.pictureurl : "",
                            socket
                        ));                         
                }
                roomselected[0] && roomselected[0].user.push(new user(
                        messageReceived.sender.name,
                        messageReceived.sender.pictureurl == undefined ? 
                            "" : messageReceived.sender.pictureurl,
                        socket
                    ));                                                             // join room
                let msgeToDispatch = messageFormat("EnterRoom",["success",messageReceived.payload.id]);       // make message
                
                socket.send(msgeToDispatch);
                break;

            case "RoomExit" :
                // todo here
                // assign if not
                let roomselectedhere = roomlist.filter((room) => {
                        return room.code == messageReceived.payload.code 
                        && room.id == messageReceived.payload.id;
                });
                
                if(roomselectedhere.length == 0) break;
                roomselectedhere[0].user = roomselectedhere[0].user.filter((user) => {
                    return user.name != messageReceived.sender.name
                })
                
                break;

            case "GetMessage" :
                let roomTemp = roomlist.filter((room) => {
                    return room.user.reduce((acc, curr) => {
                        return acc || curr.name == messageReceived.sender.name;
                    },false);
                });
                let mgeToDispatch = messageFormat("NewMessage",
                    roomTemp[0] == undefined ? new Array() : roomTemp[0].message);       // make message
                
                socket.send(mgeToDispatch);
                break;

            case "SendMessage" :
                let roomTmp = roomlist.filter((room) => {
                    return room.user.reduce((acc, curr) => {
                        return acc || (curr.name == messageReceived.sender.name)
                    },0);
                });
                roomTmp[0].message.push(new message(
                    messageReceived.sender.name, messageReceived.payload
                ));
                    
                let msgToDispatch = messageFormat("NewMessage", 
                    roomTmp[0] == undefined ? "" : roomTmp[0].message);       // make message
                roomTmp[0].user.forEach((user) => {
                    user.connection.send(msgToDispatch);
                });
                break;

            case "pong" :
                // pong logic

            default:
                break;
        }
        roomcheckmutex = false;
    });
});



// Constructors
function messageFormat(type, data) {
    let toReturn = {};
    toReturn.type = type;
    toReturn.data = data;

    return JSON.stringify(toReturn);
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
    this.time = (new Date()).toString();

    return this;
}

// ID generator
function makeid() {
    let length = 9;
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
   return result;
}
function generateUniqueRoomId() {
    let roomid = Math.floor(Math.random() * 100);
    while(
        roomlist != 0
        &&
        !roomlist.reduce((acc,curr) => {
            return acc || curr.id == roomid;
        })
    ) {
        roomid = Math.floor(Math.random() * 100); 
    }
    return roomid;
}


// Reference https://www.npmjs.com/package/ws
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

/*
const { Client } = require("pg");
const client = new Client();
client.connect();
*/