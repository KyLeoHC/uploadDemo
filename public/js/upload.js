/**
 * 文件上传插件
 * 支持大文件分割上传
 * by KyLeo on 2016/6/24.
 */
(function ($, window, undefined) {
    var cache = {}; //文件数据缓存对象
    var option = {  //默认参数选项
        'immediately': false,  //选择完文件是否立刻上传
        'needDivided': true,    //是否把文件分块
        'SIZE_OF_SHARD': 2 * 1024 * 1024, //单位为byte
        'onBefore': null,      //开始上传前的回调
        'onProgress': null,    //上传过程中的回调
        'onComplete': null     //最后一块数据上传完成时的回调
    };
    var method = {
        'divide': function (file, option) {
            var fileData = {
                'name': file.name,
                'size': file.size,
                'index': 0, //标记该文件上传到了哪一块
                'shardCount': 1, //总块数
                'data': []
            };
            var i, start, end;

            if (cache[fileData.name]) {
                log('该文件已经存在');
            } else {
                if (option.needDivided) {
                    fileData.shardCount = Math.ceil(fileData.size / option.SIZE_OF_SHARD);
                    for (i = 0; i < fileData.shardCount; i++) {
                        start = i * option.SIZE_OF_SHARD;
                        end = Math.min(fileData.size, start + option.SIZE_OF_SHARD);
                        fileData.data.push(file.slice(start, end)); //文件块数据，Blob类型
                    }
                } else {
                    fileData.data.push(file); //文件数据，File类型
                }
                cache[fileData.name] = fileData;
            }
            log('分片完成');
            log(cache[fileData.name]);
            if (option.immediately) {
                this.post(fileData.name, option);
            }
        },
        'post': function (name, option) {
            var fileData = cache[name], that = this;
            if (!fileData) {
                log('文件不存在');
                return;
            }
            if (fileData.index === 0) {
                log('文件开始上传');
                option.onBefore && option.onBefore();
            }
            if (fileData.index === fileData.shardCount) {
                log('文件已经上传完成');
                delete cache[name];
                option.onComplete && option.onComplete();
                return;
            }

            var form = new FormData();
            form.append('name', fileData.name);
            form.append('index', fileData.index + 1);
            form.append('shardCount', fileData.shardCount);
            form.append('data', fileData.data[fileData.index]);
            $.ajax({
                'url': option.url,
                'type': 'post',
                'data': form,
                'processData': false,
                'contentType': false
            }).done(function () {
                option.onProgress && option.onProgress(fileData.index, fileData.shardCount);
                fileData.index++;
                that.post(name, option);
            });
        }
    };

    function log(msg) {
        console.log(msg);
    }

    function init(el, opt) {
        el.on('change.listen', function () {
            log(this.files);
            method.divide(this.files[0], opt);
        }).on('fileUpload', function () {
            //适用于手动触发提交事件
            method.post(this.files[0].name, opt);
        });
    }

    $.fn.upload = function (opt) {
        opt = opt || {};
        if (!opt.url) {
            log('远程文件服务器URL不能为空');
            return;
        }
        opt.immediately = opt.immediately === undefined ? option.immediately : opt.immediately;
        opt.needDivided = opt.needDivided === undefined ? option.needDivided : opt.needDivided;
        opt.SIZE_OF_SHARD = opt.SIZE_OF_SHARD || option.SIZE_OF_SHARD;
        opt.onBefore = opt.onBefore;
        opt.onProgress = opt.onProgress;
        opt.onComplete = opt.onComplete;
        init(this, opt);
    };
})(jQuery, window, undefined);