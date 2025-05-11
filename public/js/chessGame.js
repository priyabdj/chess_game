const socket = io("https://chess-backend.onrender.com", { transports: ['polling'] });

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square.type, square.color);  // Optional: show the actual piece
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = {
                            row: rowIndex,
                            col: squareIndex
                        };
                        e.dataTransfer.setData("text/plain",e.target.innerText);
                    }
                });
pieceElement.addEventListener("dragend", (e) => {draggedPiece = null;})
                squareElement.appendChild(pieceElement); // <== Important: add piece to square
            }


            squareElement.addEventListener("dragover", (e) => {e.preventDefault();});

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if(draggedPiece){
                    const targetSource ={
                        row:parseInt(squareElement.dataset.row),
                        col:parseInt(squareElement.dataset.col )
                    };
                    handleMove(sourceSquare , targetSource);
                }
            })
            boardElement.appendChild(squareElement); // Add square to board
        });
    });

    console.log(board);
};

const handleMove = (source,target)=>{
    const move ={
        from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
        to:`${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion:"q"
    }
   const result = chess.move(move); // Validate the move locally
   if (result) {
       socket.emit("move", move); // Emit the move only if valid
       renderBoard(); // Re-render the board after a valid move
   } else {
       console.error("Invalid move attempted:", move);
   }
}
const getPieceUnicode = (type, color) => {
    const pieces = {
        p: { w: "♙", b: "♟" },
        r: { w: "♖", b: "♜" },
        n: { w: "♘", b: "♞" },
        b: { w: "♗", b: "♝" },
        q: { w: "♕", b: "♛" },
        k: { w: "♔", b: "♚" },
    };
    return pieces[type]?.[color] || "";
};


socket.on("playerRole",function(role){
    playerRole = role;
    renderBoard();
})

socket.on("spectatorRole",function(){
    playerRole = null;
    renderBoard();
})

socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
})
socket.on("move", function(move) {
    const result = chess.move(move); // ✅ apply move
    if (result) {
        renderBoard();
    } else {
        console.error("Invalid move received:", move);
    }
});



renderBoard();
