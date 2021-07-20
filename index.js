const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || 8081
});
console.log("Listening on",process.env.PORT);

let roomlist = [];
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
    // roomlist = roomlist.filter((room) => {
    //     return room.user.length > 0;
    // })
    // console.log(roomlist);
}, 10000);


wss.on("connection", socket => {

    socket.on("message", messageFromUser => {

        console.log(messageFromUser);
        let messageReceived = JSON.parse(messageFromUser);
        let messageType = messageReceived.type;
        console.log(messageType);

        let messageToDispatch = null;
        switch (messageType) {

            case "RoomList" :
                let roomList = roomlist.map((elm) => {
                    return {
                        id : elm.id,
                        name : elm.name,
                        creator : elm.creator,
                        code : elm.code
                    }
                });

                roomList[0].creator = (new Date()).toString();
                
                console.log(roomList[0].creator);
                let messageToDispatch = messageFormat("RoomList",roomList);
                
                console.log("todispatch", messageToDispatch);
                socket.send(messageToDispatch);
                break;

            case "RoomMake" :
                console.log("Make");
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
                console.log("doneMake")
                break;

            case "RoomEnter" :
                let roomselected = roomlist.filter((room) => {
                        return room.code === messageReceived.payload.code 
                            && room.id === messageReceived.payload.id;
                    });
                if(roomselected.length == 0) {
                    let roomid = generateUniqueRoomId();
                    roomList.push(new room(roomid, messageType.payload.name,
                        messageType.payload.creator, messageReceived.payload.code));                            // new room
                    roomlist[roomlist.length - 1]
                        .user.push(new user(
                            messageType.sender.name,
                            messageType.sender.pictureurl == undefined ? messageType.sender.pictureurl : "",
                            socket
                        ));                         
                }
                console.log(roomselected,messageReceived.sender);
                roomselected[0] && roomselected[0].user.push(new user(
                        messageReceived.sender.name,
                        messageReceived.sender.pictureurl == undefined ? 
                            "" : messageReceived.sender.pictureurl,
                        socket
                    ));                                                             // join room
                let msgeToDispatch = messageFormat("EnterRoom",["success",messageReceived.payload.id]);       // make message
                
                console.log(msgeToDispatch);
                socket.send(msgeToDispatch);
                break;

            case "RoomExit" :
                // todo here
                // assign if not
                console.log(roomlist,"payload",messageReceived.payload);
                let roomselectedhere = roomlist.filter((room) => {
                        return room.code == messageReceived.payload.code 
                        && room.id == messageReceived.payload.id;
                });
                
                console.log("rest",roomselectedhere);
                roomselectedhere[0].user = roomselectedhere[0].user.filter((user) => {
                    return user.name != messageReceived.sender.name
                })
                
                console.log("Exit");
                console.log(roomselectedhere[0].user);
                break;

            case "GetMessage" :
                let roomTemp = roomlist.filter((room) => {
                    return room.user.name == messageType.sender.name;
                });
                messageToDispatch = messageFormat("NewMessage",roomTemp[0].message);       // make message
                
                console.log(messageToDispatch);
                socket.send(messageToDispatch);
                break;

            case "SendMessage" :
                let roomTmp = roomlist.filter((room) => {
                    return room.user.name == messageReceived.sender.name;
                });
                roomTmp[0].message.push(new message(
                    messageReceived.sender.name, messageReceived.payload
                ));

                let msgToDispatch = new messageFormat("newMessage",roomTmp[0].message);
                roomTmp[0].user.foreach((user) => {
                    user.send(msgToDispatch);
                });
                break;

            case "pong" :
                // pong logic

            default:
                console.log("Unhandled");
                break;
        }
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