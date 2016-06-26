/**
 * 合并文件
 * by KyLeo on 2016/6/25.
 */
var fs = require('fs');

function combine(path, fileList, callback) {
    var file = fileList.shift();
    fileList.forEach(function (item, index) {
        /*
        fs.readFileSync(item, function (err, data) {
            if (err) {
                console.log('[read file error - ' + index + ']:' + err);
            } else {
                fs.appendFileSync(file, data);
            }
        });*/
        console.log(item,index);
        fs.appendFileSync(file, fs.readFileSync(item));
        fs.unlinkSync(item);
    });
    fs.rename(file, path, function (err) {
        if (err) {
            console.log('[finally]: ' + err);
        } else {
            callback();
        }
    });
    //fs.unlink(file);
}

module.exports = combine;