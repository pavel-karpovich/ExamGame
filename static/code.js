const whole_container = document.querySelector(".task-container");
const v_splitter = document.querySelector(".vertical-splitter");
const h_splitter = document.querySelector(".horizontal-splitter");
const bt_panel = document.querySelector(".bottom-split-panel");
const up_panel = document.querySelector(".upper-split-panel");
const lf_panel = document.querySelector(".left-split-panel");
const rt_panel = document.querySelector(".right-split-panel");
const run_loader = document.querySelector(".run-loader");
const run_button = document.getElementById("run_button");
const confirm_button = document.getElementById("confirm_button");
const confirm_span = document.querySelector("#confirm_button > span:nth-child(1)");
const dots_span = document.querySelector("#confirm_button > span:nth-child(2)");
const confirm_loader = document.querySelector(".gears");
const code = document.getElementById("code");
const trash = document.querySelector(".terminal-trash");
const definition = document.querySelector(".md-container");
const test_result_box = document.getElementById("test_result");
const test_result_message = document.querySelector("#test_result .message-content")
const test_result_button = document.querySelector("#test_result .message-button");

let containerBox = null;

const hMove = (e) => {

    let size = 100 * (e.clientY - containerBox.top) / (containerBox.bottom - containerBox.top);
    up_panel.style.height = `calc(${size}% - 5px)`;
    bt_panel.style.height = `calc(${100 - size}% - 5px)`;
    term.fit();

}
const vMove = (e) => {

    let size = 100 * (e.clientX - containerBox.left) / (containerBox.right - containerBox.left);
    lf_panel.style.width = `calc(${size}% - 5px)`;
    rt_panel.style.width = `calc(${100 - size}% - 5px)`;
    term.fit();

}

function resizePanel(moveFunc) {

    return function(e) { 

        containerBox = whole_container.getBoundingClientRect();
        this.style.backgroundColor = "#aaa";
        this.children[0].style.backgroundColor = "#ddd";
        moveFunc(e);
        document.addEventListener("mousemove", moveFunc);

        let mouseUp = (e) => {

            this.style.backgroundColor = "";
            this.children[0].style.backgroundColor = "";
            document.removeEventListener("mousemove", moveFunc);
            document.removeEventListener("mouseup", mouseUp);
            e.stopPropagation();
        };
        document.addEventListener("mouseup", mouseUp);
        e.stopPropagation();

    }
}
h_splitter.addEventListener("mousedown", resizePanel(hMove));
v_splitter.addEventListener("mousedown", resizePanel(vMove));

const pattern = /^calc\((.+)% - 5px\)$/;
let saved_v = null;
let saved_h = null;

v_splitter.addEventListener("dblclick", function() {

    let lf_perc = pattern.exec(lf_panel.style.width)[1];
    if (saved_v && (lf_perc < 2.0 || lf_perc > 98.0)) {

        lf_panel.style.width = `calc(${saved_v}% - 5px)`;
        rt_panel.style.width = `calc(${100.0 - saved_v}% - 5px)`;

    } else if (parseFloat(lf_perc) > 50.0) {

        lf_panel.style.width = "calc(100% - 5px)";
        rt_panel.style.width = "calc(0% - 5px)";
        saved_v = lf_perc;

    } else {

        lf_panel.style.width = "calc(0% - 5px)";
        rt_panel.style.width = "calc(100% - 5px)";
        saved_v = lf_perc;

    }
    term.fit();

});

h_splitter.addEventListener("dblclick", function() {

    let up_perc = pattern.exec(up_panel.style.height)[1];
    if (saved_h && (up_perc < 2.0 || up_perc > 98.0)) {

        up_panel.style.height = `calc(${saved_h}% - 5px)`;
        bt_panel.style.height = `calc(${100.0 - saved_h}% - 5px)`;

    } else if (parseFloat(up_perc) > 50.0) {

        up_panel.style.height = "calc(100% - 5px)";
        bt_panel.style.height = "calc(0% - 5px)";
        saved_h = up_perc;

    } else {

        up_panel.style.height = "calc(0% - 5px)";
        bt_panel.style.height = "calc(100% - 5px)";
        saved_h = up_perc;

    }
    term.fit();

});

window.addEventListener("resize", () => {
    if(term) {
        term.fit();
    }
});

Terminal.applyAddon(fit); 

CodeMirror.defaults.autofocus = true;
const protocol = location.protocol === "https:" ? "wss" : "ws";
const mirror = mirrorsharp(code, {
    serviceUrl: `${protocol}://sharp.game.paradox.red/mirrorsharp`,
    selfDebugEnabled: true,
    language: "C#"
});

const codemirror = mirror.getCodeMirror();
codemirror.setOption("matchBrackets", true);
codemirror.setOption("autoCloseBrackets", true);
codemirror.setOption("lineNumbers", true);
codemirror.setOption("styleActiveLine", true);
const sourceCodeDoc = codemirror.getDoc();

const markdownConverter = new showdown.Converter();

function updateMd(text) {

    const htmlMd = markdownConverter.makeHtml(text);
    definition.innerHTML = htmlMd;

}

let isRunning = false;
let isTesting = false;

function getDefLine() {
    
    return isRunning ? "" : `[${username}@ip-172-31-5-20 ~]# `;

}

run_button.addEventListener("click", function () {

    run_button.classList.add("blocked-button");
    if (!isRunning) {

        console.time("run");
        socket.emit("exec", {
            sourceCode: sourceCodeDoc.getValue()
        });
        isRunning = true;
        run_button.classList.add("blocked-button");
        run_button.children[0].innerHTML = "Стоп";
        run_button.children[1].classList.remove("fa-play");
        run_button.children[1].classList.add("fa-stop");
        run_loader.style.opacity = 1;
        term.reset();
        echo.println("");
        echo.abortRead();
        term.focus();

    } else {

        socket.emit("stop");

    }

});

function execEnded() {

    isRunning = false;
    console.timeEnd("run");
    run_button.children[0].innerHTML = "Запуск";
    run_button.children[1].classList.remove("fa-stop");
    run_button.children[1].classList.add("fa-play");
    run_loader.style.opacity = 0;
    echo.println("");
    echo.abortRead();

}

let dots_timer = null;
confirm_button.addEventListener("click", function () {

    confirm_button.classList.add("blocked-button");
    if (!isTesting) {

        console.time("test");
        socket.emit("test", {
            sourceCode: sourceCodeDoc.getValue()
        });
        isTesting = true;
        confirm_span.innerHTML = "Прервать";
        confirm_loader.style.opacity = 1;
        dots_span.innerText = ".";
        dots_timer = setInterval(function() {

            switch (dots_span.innerText) {
                case ".":
                    dots_span.innerHTML = "..";
                    break;
                case "..":
                    dots_span.innerHTML = "...";
                    break;
                case "...":
                    dots_span.innerHTML = ".";
                    break;
            }

        }, 1000);

    } else {
        
        socket.emit("stop-test");
    }

});

function onEndTesting() {

    clearInterval(dots_timer);
    console.timeEnd("test");
    dots_span.innerText = "";
    confirm_button.classList.remove("blocked-button");
    confirm_span.innerHTML = "Проверить";
    confirm_loader.style.opacity = 0;
    isTesting = false;

}

function onTestSuccessButtonClick() {

    leave_button.classList.add("invisible");
    document.querySelector(".window.task-window").classList.add("invisible");
    document.querySelector(".die").classList.remove("invisible");
    this.removeEventListener("click", onTestSuccessButtonClick);

}

test_result_button.addEventListener("click", function () {

    test_result_box.classList.add("invisible");

});

let leave_button = document.getElementById("leave_button");
let leave_box = document.getElementById("leave_confirm");
let leave_yes = document.getElementById("leave_yes");
let leave_no = document.getElementById("leave_no");

leave_button.addEventListener("click", function() {

    leave_box.classList.remove("invisible");

});

leave_yes.addEventListener("click", function() {

    leave_box.classList.add("invisible");
    leave_button.classList.add("invisible");
    socket.emit("leave");
    document.querySelector(".window.task-window").classList.add("invisible");
    document.querySelector(".die").classList.remove("invisible");

});

leave_no.addEventListener("click", function() {

    leave_box.classList.add("invisible");

});

function showLeaveButton() {

    console.log("Now you can leave this task");
    leave_button.style.opacity = 0;
    leave_button.classList.remove("invisible");
    leave_button.style.opacity = 1;

}

function containerReady() {

    run_button.classList.remove("blocked-button");
    confirm_button.classList.remove("blocked-button");
    leave_button.classList.remove("blocked-button");

}

editorSocketInit = function() {
        
    socket.on("start", () => run_button.classList.remove("blocked-button"));

    socket.on("stop-end", () => {
        run_button.classList.remove("blocked-button");
        execEnded();
    });

    socket.on("exec-end", () => execEnded());

    socket.on("output", function (data) {

        echo.print(data.output);

    });
    
    socket.on("start-test", () => confirm_button.classList.remove("blocked-button"));

    socket.on("test-end", function (data) {

        if (data.status == "failed") {
    
            test_result_message.innerHTML = "Неудача!\n" + data.results;
            test_result_button.innerHTML = "Попробовать снова";
    
        } else {
    
            test_result_message.innerHTML = "Всё правильно!";
            test_result_button.innerHTML = "Вперёд!";
            test_result_button.addEventListener("click", onTestSuccessButtonClick);
        }
        test_result_box.classList.remove("invisible");
        onEndTesting();
    
    });
    socket.on("stop-test-end", function() {

        confirm_button.classList.remove("blocked-button");
        onEndTesting();
    
    });
    socket.on("err", function(data) {

        console.log(data.error);

    });
    socket.on("leave", showLeaveButton);

    socket.on("init", function() {

        console.log("The container was connected.");
        containerReady();

    });

}

function clearTerminal(use_defline) {

    term.reset();
    if (use_defline) {
        echo.print(getDefLine());
    }
    term.focus();

}

trash.addEventListener("click", clearTerminal);

function parseInput(input) {

    console.log("input");
    if (isRunning) {

        socket.emit("input", { input });

    }
    else if (input == "clear") {

        clearTerminal(false);

    }

}

async function bashLoop() {

    try {

        let input = await echo.read(getDefLine());
        parseInput(input);
        bashLoop();

    } catch (err) {

        console.log("Input error: " + err);
        bashLoop();

    }
}

let term = null;
let echo = null;
function loadTerm() {

    if (!term) {

        term = new Terminal({
            cursorBlink: true,
            rightClickSelectsWord: true
        });
        term.open(document.getElementById("term"));
        echo = new LocalEchoController(term);

        bashLoop()
        .then((data) => {  })
        .catch((err) => {  });
    }
    clearTerminal(false);

    echo.println("Connecting to the personal exam container....");
    echo.println(`Using username "${username}".`);
    echo.println("Authenticating with public key \"imported-openssh-key\"");

    echo.print(getDefLine());
    term.focus();

}

