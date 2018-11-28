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

function addPlayer(name, pos, total) {

    let list = document.getElementById("player_list");
    let list_element = document.createElement("li");
    list_element.appendChild(document.createTextNode(
        name
    ));
    list.appendChild(list_element);

    let newPlayerInfo = { initPos: pos, name, total };
    players.push(newPlayerInfo);

    let tr = document.createElement("tr");
    for (let prop in newPlayerInfo) {

        let td = document.createElement("td");
        td.textContent = newPlayerInfo[prop];
        tr.appendChild(td);

    }
    alignRowInTable(tr);

}

function loadLibraries(callback) {

    let script0 = document.createElement("script");
    //script1.setAttribute("src", "https://preview.babylonjs.com/cannon.js");
    script0.setAttribute("src", "static/cdn/cannon.js");

    let script1 = document.createElement("script");
    //script1.setAttribute("src", "https://cdn.babylonjs.com/babylon.max.js");
    script1.setAttribute("src", "static/cdn/babylon.max.js");

    let script2 = document.createElement("script");
    //script2.setAttribute("src", "https://preview.babylonjs.com/loaders/babylonjs.loaders.js");
    script2.setAttribute("src", "static/cdn/babylonjs.loaders.js");


    let countLoad = 0;
    let countAll = 3;

    let cb_wrapper = () => {

        ++countLoad;
        if (countLoad == countAll) {

            let script3 = document.createElement("script");
            script3.setAttribute("src", "static/cdn/babylon.manager.js");
            if (callback) {
                
                let cb_wrapper2 = () => {

                    callback();

                }
                script3.onload = cb_wrapper2;

            }
            document.body.appendChild(script3);

        }

    }
    script0.onload = cb_wrapper;
    script1.onload = cb_wrapper;
    script2.onload = cb_wrapper;
    document.body.appendChild(script0);
    document.body.appendChild(script1);
    document.body.appendChild(script2);

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
            break;
        case SessionState.INGAME:
            lobby_div.classList.add("invisible");
            game_div.classList.remove("invisible");
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

            addPlayer(data.name, data.pos, data.total);

        }

    });
    socket.on("start-game", function(data) {

        setSessionState(SessionState.INGAME);
        renderGame();

    });
    socket.on("update-player", function(data) {

        console.log(data);
        let player = players.find((pl) => pl.name == data.name);
        if (player) {

            let row = updateTableRow(data.path[data.path.length - 1], data.name, data.total);
            alignRowInTable(row);
            player.ghost.goby(data.path);

        }

    });

}

onGameRendered = function() {

    console.log("START!");
    let hud = document.querySelector(".hud-container");
    hud.classList.remove("invisible");
    let el = document.querySelector(".die");
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

                addPlayer(pl.name, pl.pos, pl.total);
        
            }
            connect();
            if (data.playerState == SessionState.LOBBY) {

                loadLibraries();
                
            } else if (data.playerState == SessionState.INGAME) {

                loadLibraries(renderGame);

            }

        }
        setSessionState(data.playerState);

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

            addPlayer(pl.name, pl.pos, pl.total);
    
        }
        setSessionState(SessionState.LOBBY);
        document.getElementById("game_name_1").textContent = sessionName;
        connect();
        setTimeout(loadLibraries, 1000);

    } catch(error) {

        console.log("Error in request to the game/reg api: \n" + error);

    }

}


document.addEventListener("DOMContentLoaded", checkGameState, false);
confirm_input.addEventListener("click", registerInGame, false);