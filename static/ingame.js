let confirm_input = document.getElementById("reg_confirm");

let params = (new URL(document.location)).searchParams;
let gameSession = params.get("session");

let sessionName;
let username;
let socket;
let dice;

const SessionState = {
    UNAUTH: "unauth",
    LOBBY: "lobby",
    INGAME: "ingame",
    ENDING: "ending"
}

function addPlayerName(name) {

    let list = document.getElementById("player_list");
    let list_element = document.createElement("li");
    list_element.appendChild(document.createTextNode(
        name
    ));
    list.appendChild(list_element);

}

function loadLibraries(callback) {

    let script1 = document.createElement("script");
    script1.setAttribute("src", "https://cdn.babylonjs.com/babylon.max.js");

    let script2 = document.createElement("script");
    script2.setAttribute("src", "https://preview.babylonjs.com/loaders/babylonjs.loaders.js");


    let countLoad = 0;
    let countAll = 2;

    let cb_wrapper = () => {

        ++countLoad;
        if (countLoad == countAll) {

            let script3 = document.createElement("script");
            script3.setAttribute("src", "static/babylon.manager.js");
            if (callback) {
                
                let cb_wrapper2 = () => {

                    callback();

                }
                script3.onload = cb_wrapper2;

            }
            document.body.appendChild(script3);

        }

    }
    script1.onload = cb_wrapper;
    script2.onload = cb_wrapper;
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

    socket = io.connect("localhost:5000/game");
    socket.on("player-list", function(data) {

        for (let player of data) {

            addPlayerName(player.name);

        }

    });
    socket.on("new-player", function(data) {

        if (data.name) {

            addPlayerName(data.name);

        }

    });
    socket.on("start-game", function(data) {

        setSessionState(SessionState.INGAME);
        renderGame();

    });

}

onGameRendered = function() {

    console.log("START!");
    let el = document.querySelector(".die");
    dice = new Die(el);
    el.classList.remove("invisible");
    el.addEventListener("click", () => {

        dice.startRoll();
        fetch("game/dice", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        }).then((response) => {

            console.log(response);
            return response.json();

        }).then((data) => {

            console.log(data);
            dice.endRoll(data.dice);

        }).catch((error) => {

            console.log("Error in request to the game/dice api: \n" + error);
    
        });

    });

};


function checkGameState() {

    let body = {
        sessionId: gameSession
    };
    fetch("game", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }).then((response) => {

        return response.json();

    }).then((data) => {

        if (data.error) {

            console.log("Response from game api return error: \n" + data.error);
            return -1;

        }
        sessionName = data.sessionName;
        document.getElementById("game_name_1").textContent = sessionName;
        document.getElementById("game_name_2").textContent = sessionName;
        if (data.playerState != SessionState.UNAUTH) {

            connect();
            if (data.playerState == SessionState.LOBBY) {

                loadLibraries();
                
            } else if (data.playerState == SessionState.INGAME) {

                loadLibraries(renderGame);

            }

        }
        setSessionState(data.playerState);

    }).catch((error) => {

        console.log("Error in request to the game api: \n" + error);

    });

}

function registerInGame() {

    let username_input = document.getElementById("username");
    let body = {
        sessionId: gameSession,
        username: username_input.value
    };
    fetch("game/reg", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }).then((response) => {

        return response.json();

    }).then((data) => {

        if (data.error) {

            console.log("Response from game/reg api return error: \n" + data.error);
            return -1;

        }
        username = username_input.value;
        setSessionState(SessionState.LOBBY);
        document.getElementById("game_name_1").textContent = sessionName;
        connect();
        setTimeout(loadLibraries, 1000);

    }).catch((error) => {

        console.log("Error in request to the game/reg api: \n" + error);

    });

}


document.addEventListener("DOMContentLoaded", checkGameState, false);
confirm_input.addEventListener("click", registerInGame, false);