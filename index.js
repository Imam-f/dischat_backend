const { Client } = require("pg");
const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "example",
    database: "postgres"
});
client.connect();
console.log("Connect to database");

console.log('no err 1');
// =============================================

const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || 8081
});
console.log("Listening on", process.env.PORT);

console.log('no err 2');
// ==============================================

// var roomlist = [];
// var roomcheckmutex = false;
var connectionlist = new Map();

// ----------------------------------------------

// client.query("SELECT * FROM room",(err,res) => {
//     console.log("Inside Query",res);
//     res.rows.forEach(row => {
//         roomlist.push(new room(
//             row.id,
//             row.name,
//             row.creator,
//             row.code
//         ));
//     })
// });

// for(i = 0; i < 1 + Math.random() * 10 ;i++) {
//     let roomid = generateUniqueRoomId();
//     roomlist.push(new room(
//         roomid,
//         "Anything",
//         "Origin",
//         makeid()
//     ));
// }

// roomlist.forEach(room => {
//     let qr = "INSERT INTO room " +
//         `VALUES (${room.id}, '${room.name}', '${room.creator}',`
//         + ` '${room.code}');`;
//     console.log(qr);
//     client.query(qr);
// })


// ==============================================

// Room Pooling
// use interval to each room

// Disabled for database experiment

setInterval(() => {
    // console.log("Room");
    // console.log('no err 3');

    // console.log('no err loop3');
    // while(roomcheckmutex) {}
    // console.log('no err loop4');
    // roomcheckmutex = true;
    
    // todo
    // Get room idle room
    // Delete idle room


    // Get inactive user
    let toErase = []
    connectionlist.forEach((user,key) => {
        user.send(messageFormat("ping","ping"));
        // console.log(key);
        toErase.push(key);
    });
    toErase.forEach(val => {
        connectionlist.delete(toErase);
    })

    roomcheckmutex = false;
    // console.log('no err 4');
}, 5000);

// ===============================================

wss.on("connection", socket => {

    socket.on("message", async messageFromUser => {

        // Parse message
        let messageReceived = JSON.parse(messageFromUser);
        let messageType = messageReceived.type;
        if(messageType == "pong") {
            // console.log("Active");
            connectionlist.set(messageReceived.sender.name, socket);
            return;
        }
        console.log(messageType,"Type");
        console.log('no err 5');

        // console.log('no err loop1');
        // while(roomcheckmutex) {}
        // console.log('no err loop2');
        // roomcheckmutex = true;


        // pull database
        // todo pull message
        // todo pull user
        // todo update connection per user
        var isChanged = true;
        let roomlist = [];
        let userQuery = await client.query("SELECT * FROM users");
        let messageQuery = await client.query("SELECT * FROM message");
        let roomQuery = await client.query("SELECT * FROM room");
        roomQuery.rows.map(row => {
            roomlist.push(new room(
                row.id,
                row.name,
                row.creator,
                row.code
            ));
            roomlist[roomlist.length - 1].message = [];
            roomlist[roomlist.length - 1].user = [];

            // push user
            userQuery.rows.forEach((users) => {
                if(users.roomid == row.id) {
                    
                    // corelate user and connection
                    let connectiondata = (connectionlist.has(users.name)) ? 
                            connectionlist.get(users.name) : null;

                    roomlist[roomlist.length - 1].user.push(new user(
                        users.name,
                        users.pictureurl,
                        connectiondata
                    ));
                }
            });
            
            // push message
            messageQuery.rows.forEach((messageq) => {
                if(messageq.roomid == row.id) {
                    roomlist[roomlist.length - 1].message.push(new message(
                        messageq.sender,
                        messageq.text,
                        messageq.time
                    ));
                };
            });
        });
        console.log("Compare this",roomlist)
        console.log('no err 6');
        


        switch (messageType) {

            
            case "RoomList" :
                console.log('no err 7');
                // Interaction == roomlist

                let roomlst = roomlist.map((elm) => {
                    return {
                        id : elm.id,
                        name : elm.name,
                        creator : elm.creator,
                        code : elm.code
                    }
                });
                let messageToDispatch = messageFormat("RoomList",roomlst);
                
                isChanged = false;
                socket.send(messageToDispatch);
                break;


            case "RoomMake" :
                console.log('no err 8');
                // Interaction == roomlist, user

                let roomid = generateUniqueRoomId(roomlist);
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
                console.log('no err 9');
                // Interaction == roomlist, user

                let roomselected = roomlist.filter((room) => {
                        return room.code === messageReceived.payload.code 
                            && room.id === messageReceived.payload.id;
                    });
                if(roomselected.length == 0) {
                    let roomid = generateUniqueRoomId(roomlist);
                    roomlist.push(new room(roomid, messageReceived.payload.name,
                        messageReceived.payload.creator, messageReceived.payload.code));                            // new room
                    roomlist[roomlist.length - 1]
                        .user.push(new user(
                            messageReceived.sender.name,
                            messageReceived.sender.pictureurl == undefined ? messageReceived.sender.pictureurl : "",
                            socket
                        ));                         
                } else {
                    roomselected[0] && roomselected[0].user.push(new user(
                            messageReceived.sender.name,
                            messageReceived.sender.pictureurl == undefined ? 
                                "" : messageReceived.sender.pictureurl,
                            socket
                        ));                                                             // join room
                }
                let msgeToDispatch = messageFormat("EnterRoom",["success",messageReceived.payload.id]);       // make message
                
                socket.send(msgeToDispatch);

                // User to room create mapping
                connectionlist.set(messageReceived.sender.name, socket);
                break;


            case "RoomExit" :
                console.log('no err 10');
                // Interaction == roomlist, user

                let roomselectedhere = roomlist.filter((room) => {
                        return room.code == messageReceived.payload.code 
                        && room.id == messageReceived.payload.id;
                });
                
                if(roomselectedhere.length == 0) break;
                roomselectedhere[0].user = roomselectedhere[0].user.filter((user) => {
                    return user.name != messageReceived.sender.name
                });

                connectionlist.delete(messageReceived.sender.name);
                
                let mseToDispatch = messageFormat("ExitRoom","Success");       // make message
                socket.send(mseToDispatch);
                break;


            case "GetMessage" :
                console.log('no err 11');
                // Interaction == roomlist, user, data
                
                let roomTemp = roomlist.filter((room) => {
                    return room.user.reduce((acc, curr) => {
                        return acc || curr.name == messageReceived.sender.name;
                    },false);
                });
                let mgeToDispatch = messageFormat("NewMessage",
                    roomTemp[0] == undefined ? [] : roomTemp[0].message);       // make message
                
                console.log("MESSAGE",roomTemp,roomlist);
                socket.send(mgeToDispatch);
                console.log("MESSAGE-----",mgeToDispatch);
                isChanged = false;
                break;


            case "SendMessage" :
                console.log('no err 12');
                // Interaction == roomlist, user, data

                let roomTmp = roomlist.filter((room) => {
                    return room.user.reduce((acc, curr) => {
                        return acc || (curr.name == messageReceived.sender.name)
                    },0);
                });
                
                if(!roomTmp[0]) break;

                roomTmp[0].message.push(new message(
                    messageReceived.sender.name, messageReceived.payload
                ));
                    
                let msgToDispatch = messageFormat("NewMessage", 
                    roomTmp[0] == undefined ? "" : roomTmp[0].message);       // make message
                roomTmp[0].user.forEach((user) => {
                    user.connection && user.connection.send(msgToDispatch);
                });
                break;


            default:
                isChanged = false;
                console.log("Unhandled Data")
                break;
        }

        // update database
        console.log('no err 13');
        if(isChanged) {
            console.log('no err 17');
            // clear database
            let prlist = [];
            prlist[0] = client.query("DELETE FROM room WHERE true");
            prlist[1] = client.query("DELETE FROM users WHERE true");
            prlist[2] = client.query("DELETE FROM message WHERE true");
            await Promise.all(prlist).catch((e)=>{console.log(e)});
            console.log('no err 14');
            
            // push room
            var counteruser = 0;
            var countermessage = 0;
            let prlistn = [];
            console.log("ROOMLIST",roomlist);
            roomlist.forEach((room) => {
                let querystring = "INSERT INTO room (id,name,creator,code) VALUES (" + room.id.toString() + ",'" + room.name + "','" + room.creator + "','" + room.code + "');";
                console.log(querystring);
                prlistn.push(client.query(querystring));

                console.log('no err 15');
                // push user
                room.user.forEach(user => {
                    counteruser += 1;
                    querystring = "INSERT INTO users (name,pictureurl,roomid) VALUES (" + "'" + user.name + "','" + user.pictureurl + "'," + room.id.toString() + ");";
                    console.log(querystring,counteruser);
                    prlistn.push(client.query(querystring));
                });
                console.log('no err 16');
                // push message
                room.message.forEach(message => {
                    countermessage += 1;
                    querystring = "INSERT INTO message (sender,text,time,roomid) VALUES (" + "'" + message.sender + "','" + message.text + "','" + message.time + "'," + room.id.toString() + ");";
                    console.log(querystring,countermessage);
                    prlistn.push(client.query(querystring));
                });

                console.log("no err rpt")
            });
            console.log('no err 18');
            await Promise.all(prlistn).catch((e)=>console.log(e));
        }

        console.log("-");
        console.log("-");
        // roomcheckmutex = false;
    });
});

// =================================================

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

// ================================================

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
function generateUniqueRoomId(roomlist) {
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
    PGUSER=postgres \
    PGPASSWORD=example \
    PGHOST=localhost \
    PGPORT=5432 \
    PGDATABASE=postgres \
    node script.js
*/
