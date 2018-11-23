

module.exports.getPath = function(from, count) {

    let path = [];
    if (from == 8) {
        
        from = 25;
        path.push(from);
        --count;

    } else if (from == 26) {

        from = 30;
        path.push(from);
        --count;

    } else if (from == 50 || from == 51) {

        from = 56;
        path.push(from);
        --count;

    } else if (from == 55) {

        from = 42;
        path.push(from);
        --count;

    } else if (from == 29) {

        from = 17;
        path.push(from);
        --count;

    } else if (from == 24) {

        from = 37;
        path.push(from);
        --count;
    }
    let end = from + count;
    for (i = from + 1; i <= end && i <= 93; ++i) {

        path.push(i);
        if (i == 24) {

            i = 36;
            end += 12;

        } else if (i == 29) {

            i = 16;
            end -= 13;

        } else if (i == 55) {

            i = 41;
            end -= 14;

        }

    }
    return path;

}