const whole_container = document.querySelector(".task-container");
const v_splitter = document.querySelector(".vertical-splitter");
const h_splitter = document.querySelector(".horizontal-splitter");
const bt_panel = document.querySelector(".bottom-split-panel");
const up_panel = document.querySelector(".upper-split-panel");
const lf_panel = document.querySelector(".left-split-panel");
const rt_panel = document.querySelector(".right-split-panel");

let containerBox = null;

Terminal.applyAddon(fit); 
const term = new Terminal();
term.open(document.getElementById("term"));
term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ hfherf hesf9sehf 9gedhr rdhg89dr hg89dr hgrhg eh8gehr 9g[pheggergh erghre8gh er9gh egh eriuohgerugheah wr8hfwe[f wef8wfeh we[f hweh ewhrg e[r heg haeawhe[hgergergheheg8[he e rrrgr');
term.fit();

let vMove = (e) => {

    let size = 100 * (e.clientY - containerBox.top) / (containerBox.bottom - containerBox.top);
    up_panel.style.height = `calc(${size}% - 5px)`;
    bt_panel.style.height =  `calc(${100 - size}% - 5px)`;

}
let hMove = (e) => {

    let size = 100 * (e.clientX - containerBox.left) / (containerBox.right - containerBox.left);
    lf_panel.style.width = `calc(${size}% - 5px)`;
    rt_panel.style.width =  `calc(${100 - size}% - 5px)`;
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
v_splitter.addEventListener("mousedown", resizePanel(vMove));
h_splitter.addEventListener("mousedown", resizePanel(hMove));