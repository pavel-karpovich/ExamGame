"user strict"

let confirm_input = document.getElementById("reg_confirm");
let task_editor = document.querySelector(".task-window iframe");

let params = (new URL(document.location)).searchParams;
let gameSession = params.get("session");
task_editor.src += document.location.search;

let socket;
let dice;

const SessionState = {
    UNAUTH: "unauth",
    LOBBY: "lobby",
    INGAME: "ingame",
    ENDING: "ending"
}

function updateTableRow(pos, name, total) {

    let table = document.getElementById("lead");
    let i = 1;
    let find = false;
    for (; i < table.rows.length; ++i) {

        let row = table.rows[i]
        if (row.getElementsByTagName("td")[1].innerHTML == name) {

            find = true;
            row.getElementsByTagName("td")[0].innerHTML = pos;
            row.getElementsByTagName("td")[2].innerHTML = total;
            break;

        }

    }
    return find ? table.rows[i] : null;

}

function alignRowInTable(tr) {
    
    let table = document.getElementById("lead");
    let i = 1;
    let newPos = parseInt(tr.getElementsByTagName("td")[0].innerHTML);
    for (; i < table.rows.length; ++i) {

        if (parseInt(table.rows[i].getElementsByTagName("td")[0].innerHTML) < newPos) {

            break;

        }

    }
    if (i != table.rows.length) {

        table.insertBefore(tr, table.rows[i]);
    
    } else {

        table.appendChild(tr);

    }

}

function addPlayer(player) {

    let list = document.getElementById("player_list");
    let list_element = document.createElement("li");
    list_element.appendChild(document.createTextNode(
        player.name
    ));
    if (player.name == username) {

        list_element.classList.add("player-name");

    }
    list.appendChild(list_element);

    players.push(player);

    let tr = document.createElement("tr");

    let td1 = document.createElement("td");
    td1.textContent = player.pos;
    tr.appendChild(td1);

    let td2 = document.createElement("td");
    td2.textContent = player.name;
    tr.appendChild(td2);

    let td3 = document.createElement("td");
    td3.textContent = player.total;
    tr.appendChild(td3);

    alignRowInTable(tr);

}

// function loadLibraries(callback) {

//     let script0 = document.createElement("script");
//     //script1.setAttribute("src", "https://preview.babylonjs.com/cannon.js");
//     script0.setAttribute("src", "static/cdn/cannon.js");

//     let script1 = document.createElement("script");
//     //script1.setAttribute("src", "https://cdn.babylonjs.com/babylon.max.js");
//     script1.setAttribute("src", "static/cdn/babylon.max.js");

//     let script2 = document.createElement("script");
//     //script2.setAttribute("src", "https://preview.babylonjs.com/loaders/babylonjs.loaders.js");
//     script2.setAttribute("src", "static/cdn/babylonjs.loaders.js");


//     let countLoad = 0;
//     let countAll = 3;

//     let cb_wrapper = () => {

//         ++countLoad;
//         console.log("Load round 1");
//         if (countLoad == countAll) {

//             let script3 = document.createElement("script");
//             script3.setAttribute("src", "static/cdn/babylon.manager.js");

//             countLoad = 0;
//             countAll = 1;

//             if (callback) {
                
//                 let cb_wrapper2 = () => {

//                     console.log("Load round 2");
//                     ++countLoad;
//                     if (countLoad == countAll) {

//                         callback();

//                     }

//                 }
//                 script3.onload = cb_wrapper2;

//             }
//             document.body.appendChild(script3);

//         }

//     }
//     script0.onload = cb_wrapper;
//     script1.onload = cb_wrapper;
//     script2.onload = cb_wrapper;
//     document.body.appendChild(script0);
//     document.body.appendChild(script1);
//     document.body.appendChild(script2);

// }

function setSessionState(sessionState) {

    let register_div = document.getElementById("register");
    let lobby_div = document.getElementById("lobby");
    let game_div = document.getElementById("game");
    switch (sessionState) {

        case SessionState.UNAUTH:
            register_div.classList.remove("invisible");
            break;
        case SessionState.LOBBY:
            register_div.classList.add("invisible");
            lobby_div.classList.remove("invisible");
            document.dispatchEvent(new Event("onenterlobby"));
            break;
        case SessionState.INGAME:
            lobby_div.classList.add("invisible");
            game_div.classList.remove("invisible");
            document.dispatchEvent(new Event("onentergame"));
            break;
        case SessionState.ENDING:

            break;
        default:
            console.log("Something truly wrong in switch.");

    }

}

function connect() {

    socket = io.connect("/game");
    socket.on("new-player", function(data) {

        if (data.name && !players.find((pl) => pl.name == data.name)) {

            addPlayer(data);

        }

    });
    socket.on("start-game", function(data) {

        let color = customMaterial.diffuseColor.toHexString();
        let texture = customMaterial.diffuseTexture.getContext().canvas.toDataURL("image/png");
        socket.emit("player-style", {
            "diffuseColor": color,
            "textureDataUrl": texture
        });
        let localPlayer = players.find((pl) => pl.name == username);
        localPlayer.diffuseColor = color;
        localPlayer.textureDataUrl = texture;
        setSessionState(SessionState.INGAME);
        renderGame();

    });
    socket.on("player-style", function(data) {

        updatePlayerStyleLocally(data.name, data.diffuseColor, data.textureDataUrl);

    });
    socket.on("update-player", function(data) {

        let player = players.find((pl) => pl.name == data.name);
        if (player) {

            let row = updateTableRow(data.path[data.path.length - 1], data.name, data.total);
            alignRowInTable(row);
            player.ghost.goby(data.path);

        }

    });
    socket.on("message", function(data) {

        recieveMessage(data.sender, data.text);

    });

}

onGameRendered = function() {

    console.log("START!");
    let hud = document.querySelector(".hud-container");
    hud.classList.remove("invisible");
    let el = document.querySelector(".die");
    localGhost.onWalkEnd = () => {
    
        let task = document.querySelector(".window.task-window"); 
        task.classList.remove("invisible");
        //task_editor.src = task_editor.src;

    };
    dice = new Die(el);
    el.addEventListener("click", async() => {

        if (!localGhost.isGoing() && !dice.isRolling() && localGhost.cell != 93) {

            dice.startRoll();

            try {
            
                let body = {
                    sessionId: gameSession
                };
                let response = await fetch("game/dice", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                });
                let data = await response.json();
                if (data.dice) {

                    let row = updateTableRow(data.path[data.path.length - 1], username, data.total);
                    alignRowInTable(row);
                    dice.endRoll(data.dice, () => {

                        localGhost.goby(data.path);

                    });

                } else {
                    
                    dice.endRoll(1);

                }

            } catch(error) {

                console.log("Error in request to the game/dice api: \n" + error);
            
            }

        }

    });

};

async function checkGameState() {

    let body = {
        sessionId: gameSession
    };
    try {

        let response = await fetch("game", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        let data = await response.json();
        if (data.error) {

            console.log("Response from game api return error: \n" + data.error);
            return -1;

        }
        sessionName = data.sessionName;
        document.getElementById("game_name_1").textContent = sessionName;
        document.getElementById("game_name_2").textContent = sessionName;
        if (data.playerState != SessionState.UNAUTH) {

            username = data.username;
            document.querySelector(".player-info > span").textContent = username;
            for (let pl of data.playerList) {

                addPlayer(pl);
        
            }
            connect();
            if (data.playerState == SessionState.LOBBY) {

                renderPreview();
                setSessionState(SessionState.LOBBY);
                
            } else if (data.playerState == SessionState.INGAME) {

                setSessionState(SessionState.INGAME);
                renderGame();

            }

        } else {
            
            setSessionState(SessionState.UNAUTH);

        }

    } catch(error) {

        console.log("Error in request to the game api: \n" + error);

    }

}

async function registerInGame() {

    let username_input = document.getElementById("username");
    let body = {
        sessionId: gameSession,
        username: username_input.value
    };
    try {

        let response = await fetch("game/reg", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        let data = await response.json();
        if (data.error) {

            alert(data.error);
            return -1;

        }
        username = username_input.value;
        document.querySelector(".player-info > span").textContent = username;
        for (let pl of data.playerList) {

            addPlayer(pl);
    
        }
        document.getElementById("game_name_1").textContent = sessionName;
        renderPreview();
        setSessionState(SessionState.LOBBY);
        connect();

    } catch(error) {

        console.log("Error in request to the game/reg api: \n" + error);

    }

}

document.addEventListener("DOMContentLoaded", checkGameState, false);
confirm_input.addEventListener("click", registerInGame, false);

