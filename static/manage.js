"use strict"

let start_btn = document.getElementById("start");
let create_btn = document.getElementById("create");

let sessionName;
let socket;

const ManageGameState = {
    NONE: "none",
    PREPARE: "prepare",
    GAME: "game",
    END: "end"
}

function addPlayerName(name) {

    let list = document.getElementById("player_list");
    let list_element = document.createElement("li");
    list_element.appendChild(document.createTextNode(
        name
    ));
    list.appendChild(list_element);

}

function setSessionState(sessionState) {

    let creating_div = document.getElementById("creating");
    let preparing_div = document.getElementById("preparing");
    let monitor_div = document.getElementById("monitoring");
    switch (sessionState) {

    case ManageGameState.NONE:
        creating_div.classList.remove("invisible");
        break;
    case ManageGameState.PREPARE:
        preparing_div.classList.remove("invisible");
        creating_div.classList.add("invisible");
        break;
    case ManageGameState.GAME:
        monitor_div.classList.remove("invisible");
        preparing_div.classList.add("invisible");
        break;
    case ManageGameState.END:

        break;
    default:
        console.log("Something truly wrong in switch.");

    }

}

function registerSocket() {

    socket = io.connect("/manage");
    socket.on("new-player", function(data) {

        if (data.name) {

            addPlayerName(data.name);

        }
        
    });
    socket.on("take-link", function(data) {

        let links = document.querySelectorAll(".join-links-container > div");
        for (let link of links) {

            if (link.innerHTML.includes(data.link)) {

                document.querySelector(".join-links-container").removeChild(link);
                break;

            }
        }
    });

}

function createSession() {

    let name_input = document.getElementById("name");
    let time_input = document.getElementById("time");
    if (name_input.value != "" && time_input.value != "") {

        let body = {
            name: name_input.value,
            time: time_input.value
        };
        fetch("manage/create", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }).then((response) => {

            return response.json();

        }).then((data) => {

            let link_input = document.getElementById("link");
            link_input.value = data.directLink;
            registerSocket();
            setSessionState(ManageGameState.PREPARE);

        }).catch((error) => {

            console.log("Error in request to manage/create api: \n" + error);

        });

    }
    
}

let link_container = document.querySelector(".join-links-container");
function addLink(link) {

    let newLinkElement = document.createElement("div");
    newLinkElement.innerHTML = link;
    link_container.appendChild(newLinkElement);

}

function getData() {

    fetch("manage", {
        method: "POST",
        credentials: "include",
    }).then((response) => {

        return response.json();

    }).then((data) => {

        if (data.error != undefined) {

            console.log("Response from manage api return error: \n" + data.error);
            return -1;

        }
        switch (data.sessionState) {
        
        case ManageGameState.NONE:
            break;

        case ManageGameState.PREPARE:
            let link_input = document.getElementById("link");
            link_input.value = data.directLink;
            for (let player of data.players) {
                addPlayerName(player.name);
            }
            registerSocket();
            break;

        case ManageGameState.GAME:
            for (let link of data.links) {
                addLink(link);
            }
            registerSocket();
            break;

        }
        
        setSessionState(data.sessionState);

    }).catch((error) => {

        console.log("Error in request to manage api: \n" + error);

    });

}

function startGame() {

    fetch("manage/start", {
        method: "POST",
        credentials: "include",
    }).then((response) => {

        return response.json();

    }).then((data) => {

        if (data.error != undefined) {

            console.log("Response from manage/start api return error: \n" + data.error);
            return -1;

        }
        setSessionState(ManageGameState.GAME);

    }).catch((error) => {

        console.log("Error in request to manage/start api: \n" + error);

    });

}

document.addEventListener("DOMContentLoaded", getData, false);

create_btn.addEventListener("click", createSession, false);
start_btn.addEventListener("click", startGame, false);

let belated_link_button = document.getElementById("belated_join");
belated_link_button.addEventListener("click", function() {

    let api = "manage/link";
    fetch(api, {
        method: "POST",
        credentials: "include",
    }).then((response) => {

        return response.json();

    }).then((data) => {

        if (data.error != undefined) {

            console.log(`Response from ${api} api return error: \n${data.error}`);
            return -1;

        }
        addLink(data.personalLink);

    }).catch((error) => {

        console.log("Error in request to manage/link api: \n" + error);

    });

});
