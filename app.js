const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require("chess.js");

const app = express();
const path = require('path');
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "W";
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('index',{title :"Chess Game"});
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    uniquesocket.on("join", function () {
        io.emit("joined");

        if (!players.white) {
            players.white = uniquesocket.id;
            uniquesocket.emit("playerRole", "W");
        } else if (!players.black) {
            players.black = uniquesocket.id;
            uniquesocket.emit("playerRole", "B");
        } else {
            uniquesocket.emit("spectatorRole");
        }
    });

    uniquesocket.on('disconnect', function () {
        console.log("disconnected");

        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move");
                uniquesocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            uniquesocket.emit("invalidMove", move);
        }
    });
});


server.listen(3000, () => {
    console.log('Server is running on port 3000');
});