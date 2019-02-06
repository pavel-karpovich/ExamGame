"user strict"

let confirm_input = document.getElementById("reg_confirm");

let params = (new URL(document.location)).searchParams;
let gameSession = params.get("session");

let socket;
let dice;

const SessionState = {
    UNAUTH: "unauth",
    LOBBY: "lobby",
    INGAME: "ingame",
    ENDING: "ending"
}

function updateTableRow(pos, name, total, out) {

    let table = document.getElementById("lead");
    let i = 1;
    let find = false;
    for (; i < table.rows.length; ++i) {

        let row = table.rows[i]
        if (row.getElementsByTagName("td")[1].innerHTML == name) {

            find = true;
            row.getElementsByTagName("td")[0].innerHTML = pos;
            row.getElementsByTagName("td")[2].innerHTML = total;
            row.getElementsByTagName("td")[3].innerHTML = out;
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

    let td4 = document.createElement("td");
    td4.textContent = player.out;
    tr.appendChild(td4);

    alignRowInTable(tr);

}

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


let editorSocketInit = null;

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

            let row = updateTableRow(data.path[data.path.length - 1], data.name, data.total, data.out);
            alignRowInTable(row);
            player.ghost.goby(data.path);

        }

    });
    socket.on("message", function(data) {

        recieveMessage(data.sender, data.text);

    });

    editorSocketInit();

}

let el_dice = document.querySelector(".die");
let taskWnd = document.querySelector(".window.task-window");

async function showEditor() {

    taskWnd.style.opacity = 0;
    taskWnd.classList.remove("invisible");
    loadTerm();
    el_dice.classList.add("invisible");
    taskWnd.style.opacity = 1;
    let body = {
        sessionId: gameSession
    };
    let taskResponse = await fetch("game/task", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    let taskRes = await taskResponse.json();
    sourceCodeDoc.setValue(taskRes.startup);
    updateMd(taskRes.definition);

}
let task_hanging = false;

onGameRendered = function() {

    console.log("START!");
    let hud = document.querySelector(".hud-container");
    hud.classList.remove("invisible");
    dice = new Die(el_dice);
    if (task_hanging) {
        showEditor();
    }
    el_dice.addEventListener("click", async() => {

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

                    let taskRes = null;
                    let needLateUpdate = false;
                    localGhost.onWalkEnd = () => {
    
                        let row = updateTableRow(data.path[data.path.length - 1], username, data.total, data.out);
                        alignRowInTable(row);
                        taskWnd.style.opacity = 0;
                        taskWnd.classList.remove("invisible");
                        loadTerm();
                        el_dice.classList.add("invisible");
                        if (taskRes) {
                           
                            sourceCodeDoc.setValue(taskRes.startup);
                            updateMd(taskRes.definition);

                        } else {

                            needLateUpdate = true;

                        }
                        taskWnd.style.opacity = 1;
                
                    }
                    dice.endRoll(data.dice, () => {

                        localGhost.goby(data.path.slice());

                    });
                    let taskResponse = await fetch("game/task", {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    });
                    taskRes = await taskResponse.json();
                    if (needLateUpdate) {

                        sourceCodeDoc.setValue(taskRes.startup);
                        updateMd(taskRes.definition);

                    }

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
                if (data.task) {

                    task_hanging = true;

                }
                if (data.leave) {
                    
                    showLeaveButton();
                    
                }

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

