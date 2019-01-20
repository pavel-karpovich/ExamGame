module.exports.getRandomId = function() {

    return "_" + Math.random().toString(36).substr(2, 9);

};

module.exports.getCookie = function(cookieString, name) {

    let matches;
    if (cookieString && name) {

        matches = cookieString.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
        ));

    }
    return matches ? decodeURIComponent(matches[1]) : undefined;

};

module.exports.getQueryParams = function(url) {

    let params = {};
    url = url.split("?")[1];
    if (url) {

        url = url.split("#")[0];
        let arr = url.split("&");
        for (let i = 0; i < arr.length; i++) {

            let a = arr[i].split("=");
            let paramName = a[0];
            let paramValue = a[1];
            if (paramName.match(/\[(\d+)?\]$/)) {

                let key = paramName.replace(/\[(\d+)?\]/, "");
                if (!params[key]) params[key] = [];

                if (paramName.match(/\[\d+\]$/)) {

                    let index = /\[(\d+)\]/.exec(paramName)[1];
                    params[key][index] = paramValue;

                } else {

                    params[key].push(paramValue);

                }

            } else {
                
                if (!params[paramName]) {

                    params[paramName] = paramValue;

                } else if (params[paramName] && typeof params[paramName] === "string") {

                    params[paramName] = [params[paramName]];
                    params[paramName].push(paramValue);

                } else {

                    params[paramName].push(paramValue);

                }

            }
            
        }

    }
    return params;

}


module.exports.randomDice = function() {

    return 1 + Math.floor(Math.random() * 6);

};