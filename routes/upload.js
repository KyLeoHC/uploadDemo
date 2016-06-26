var express = require('express');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var router = express.Router();
var combine = require('../common/combine');

/* post upload listening. */
router.post('/', function (req, res, next) {
    //生成multiparty对象，并配置上传目标路径
    var path = 'D:\\upload\\';
    var form = new multiparty.Form({uploadDir: path});
    //上传完成后处理
    form.parse(req, function (err, fields, files) {
        //console.log(fields);
        //console.log(fields);
        var filesTmp = JSON.stringify(files, null, 2);
        var respond = function () {
            res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
            res.write('received upload:\n\n');
            res.end(util.inspect({fields: fields, files: filesTmp}));
        };

        if (err) {
            console.log('parse error: ' + err);
        } else {
            console.log('parse files: ' + filesTmp);
            var index = parseInt(fields.index[0]), shardCount = parseInt(fields.shardCount[0]);
            var inputFile = files.data[0];
            var uploadedPath = inputFile.path;
            var dstPath = path + fields.name[0];
            var shardPath = shardCount > 1 ? (dstPath + '_' + index) : dstPath;
            //重命名为真实文件名
            fs.rename(uploadedPath, shardPath, function (err) {
                if (err) {
                    console.log('rename error: ' + err);
                } else {
                    console.log('rename ok');
                }
            });
            if (index === shardCount && shardCount > 1) {
                //如果是最后一块了，则进行文件合并
                var fileList = [];
                for(var i = 1;i <= shardCount;i++){
                    fileList.push(dstPath + '_' + i);
                }
                combine(dstPath, fileList, respond);
            } else {
                respond();
            }
        }
    });
});

module.exports = router;
