window.project = true;

// Project Shader Store


// Browser Window Services

//////////////////////////////////////////////
// Babylon Toolkit - Browser Window Services
//////////////////////////////////////////////

/** Firelight Audio Shims */
window.firelightAudio = 0;
window.firelightDebug = false;
if (window.firelightAudio === 1 || window.firelightAudio === 2) {

    let fmodjs = "scripts/fmodstudio.js";
    if (window.firelightDebug === true) {

        fmodjs = ("scripts/" + (window.firelightAudio === 1) ? "fmodstudioL.js" : "fmodL.js");

    } else {

        fmodjs = ("scripts/" + (window.firelightAudio === 1) ? "fmodstudio.js" : "fmod.js");

    }
    let script2 = document.createElement("script");
    script2.setAttribute("type", "text/javascript");
    script2.setAttribute("src", fmodjs);
    if (document.head != null) {

        document.head.appendChild(script2);

    } else if (document.body != null) {

        document.body.appendChild(script2);

    }

}

/** Windows Launch Mode */
window.preferredLaunchMode = 0;
if (typeof Windows !== "undefined" && typeof Windows.UI !== "undefined" && typeof Windows.UI.ViewManagement !== "undefined" && typeof Windows.UI.ViewManagement.ApplicationView !== "undefined") {

    Windows.UI.ViewManagement.ApplicationView.preferredLaunchWindowingMode = (window.preferredLaunchMode === 1) ? Windows.UI.ViewManagement.ApplicationViewWindowingMode.fullScreen : Windows.UI.ViewManagement.ApplicationViewWindowingMode.auto;

}

/** Xbox Full Screen Shims */
let st = document.querySelector("style");
if (st) {

    st.textContent += "@media (max-height: 1080px) { @-ms-viewport { height: 1080px; } }";

}

/** Xbox Live Plugin Shims */
window.xboxLiveServices = false;
window.isXboxLivePluginEnabled = function() {

    let isXboxLive = (typeof Windows !== "undefined" && typeof Microsoft !== "undefined" && typeof Microsoft.Xbox !== "undefined" && typeof Microsoft.Xbox.Services !== "undefined");
    let hasToolkit = (typeof BabylonToolkit !== "undefined" && typeof BabylonToolkit.XboxLive !== "undefined" && typeof BabylonToolkit.XboxLive.Plugin !== "undefined");
    return (window.xboxLiveServices === true && isXboxLive === true && hasToolkit === true);

}

window.createGenericPromise = function(resolveRejectHandler) {

    return new Promise(resolveRejectHandler);

}

window.resolveGenericPromise = function(resolveObject) {

    return Promise.resolve(resolveObject);
    
}