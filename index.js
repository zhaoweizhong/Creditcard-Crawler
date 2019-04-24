const Nightmare = require('nightmare')
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs');
const util = require('util')
const path = require('path')

let options = {
    flags: 'a',
    encoding: 'utf8',
}

let stdout = fs.createWriteStream('./results/result.log', options)
let stderr = fs.createWriteStream('./results/error.log', options)
let logger = new console.Console(stdout, stderr);

console.log = function() {
    logger.log(util.format.apply(null, arguments))
    process.stdout.write(util.format.apply(null, arguments) + '\n')
}

let startId = 2
let stopId = 278

console.log("开始爬取...\n")

doCrawl(startId)

function doCrawl(id) {
    const nightmare = Nightmare({
        show: false,
        waitTimeout: 10000
    })
    nightmare
        .goto('https://creditcard.cmbc.com.cn/wsv2/step?cardId=' + id + '#page=1')
        .header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
        .header('Connection', 'keep-alive')
        .header('Cookie', '_pk_ref.1.d647=%5B%22%22%2C%22%22%2C1553564338%2C%22https%3A%2F%2Fwww.google.com%2F%22%5D; _pk_id.1.d647=0dffe270e4cc1a0b.1553564338.1.1553564915.1553564338.; c_uid=ee1f96533f7452cc63f3fe8717bdd093b361eef8183177619ea71c3c9641f0f3fbe2fd8241b2d819; BIGipServercreditcard-new-web-80-pool=!dn7Frp48FFDtRKe+n7gHhjPuOFWINAIPJNvz7VM568zJt1HDsXTlPoRTyU8DanzjHLqz0BAuGO1jlQ==; __maxent_ckid=d0bec692-31e3-460b-bb96-485ceec50b03; __maxent_jsid=a101ced15fe9410ea4fbe5ea9c24562c; Hm_lvt_c401ec5fe189630d3d6d6c05e66717dc=1556124347; Hm_lpvt_c401ec5fe189630d3d6d6c05e66717dc=1556127003')
        .header('Accept-Encoding', 'gzip, deflate, br')
        .header('Accept-Language', 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6,ja;q=0.5')
        .header('Cache-Control', 'no-cache')
        .header('Pragma', 'no-cache')
        .header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36')
        .wait('.main-hd-border')
        .evaluate(() => {
            return document.body.innerHTML;
        })
        .end()
        .then(body => {
            let $ = cheerio.load(body)
            if ($("title").innerHTML == "出错了") {
                console.log("无该卡，跳过：" + id)
            }
            else if ($(".ui-check-txt2")[0] === undefined) {
                console.log("无该卡，跳过：" + id)
            } else {
                for (let index = 0; index < $(".ui-check-txt2").length; index++) {
                    let name = $(".ui-check-txt2")[index].children[0].data;
                    let imageSrc = $(".img").eq(index).attr('src');
                    if (imageSrc.length > 0) {
                        console.log("开始下载：" + id + " - " + index + " - " + name);
                        download(imageSrc, id, index, name);
                        console.log("下载完成：" + id + " - " + index + " - " + name)
                    } else {
                        console.log("无图片，跳过：" + id + " - " + index)
                    }
                }
            }
            if (id < stopId) {
                doCrawl(id + 1)
            } else {
                console.log("爬取结束...")
            }
        })
        .catch(error => {
            console.error('Search failed:', error)
            if (String(error).indexOf('timed out') > 0) {
                console.log("无该卡，跳过：" + id)
                if (id < stopId) {
                    doCrawl(id + 1)
                } else {
                    console.log("爬取结束...")
                }
            }
        })
}

function download(uri, id, index, name) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream("./results/" + id + " - " + index + " - " + name + path.extname(uri)))
    })
}