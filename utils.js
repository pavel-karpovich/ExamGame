
module.exports.ID = function() {

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

module.exports.randomDice = function() {

    return Math.floor(Math.random() * 6);

}