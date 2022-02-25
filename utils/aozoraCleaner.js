const { Transform } = require("stream");
const fs = require("fs");
const byline = require("byline");


const gaijiDictionary = {};

let stream = fs.createReadStream(__dirname + "/../assets/jisx0213-2004-std.txt");
stream = byline.createStream(stream);

stream.on("data", (line) => {
    const text = line.toString();
    if (text.startsWith("#")) return;
    const reg = text.match(/(?<key>\d-\w{4})\tU\+(?<value>\w{4,5})/);
    if (reg?.groups?.key && reg?.groups?.value) {
        gaijiDictionary[reg.groups.key] = String.fromCharCode(Number("0x" + reg.groups.value));
    }
});

stream.on("finish", () => {
    console.log("Dictionary created");
})


class ToStringify extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
    }
    _transform(chunk, encoding, callback) {
        this.push(chunk.toString());
        callback();
    }
}
class ToBufferify extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
    }
    _transform(chunk, encoding, callback) {
        this.push(Buffer.from(chunk));
        callback();
    }
}

//※［＃「券」の「刀」に代えて「手」］変換
class GaijiTranslator extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
    }
    _transform(chunk, encoding, callback) {
        this.push(
            chunk.replace(/※［＃.+?］/g, (x) => {
                let m = x.match(/(\d)-(\d{1,2})-(\d{1,2})/);
                if (m) {
                    return gaijiDictionary[(Number(m[1]) + 2).toString() + "-" + (Number(m[2]) + 32).toString(16).toUpperCase() + (Number(m[3]) + 32).toString(16).toUpperCase()];
                } else {
                    m = x.match(/U\+(\w{4})/)
                    if (m) {
                        return String.fromCharCode(Number("0x" + m[1]));
                    } else {
                        return x;
                    }
                }
            })
        )
        callback();
    }
}

//《》削除
//｜削除
class KigouRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
    }
    _transform(chunk, encoding, callback) {
        this.push(chunk.replace(/《[^《》]+》/g, "").replace(/｜/g, ""));
        callback();
    }
}


//［＃ここから５字下げ］削除
class ChukiRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
    }
    _transform(chunk, encoding, callback) {
        this.push(chunk.replace(/(?<!※)［＃[^［＃］]+］/g, ""));
        callback();
    }
}

class DescriptionRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._inDescription = false;
    }
    _transform(chunk, encoding, callback) {
        if (/^-+$/.test(chunk)) {
            this._inDescription = !this._inDescription;
            callback();
            return;
        }
        if (!this._inDescription) {
            this.push(chunk)
        }
        callback();
    }
}

module.exports = {
    ToStringify, ToBufferify, ChukiRemover, GaijiTranslator, KigouRemover, DescriptionRemover
}