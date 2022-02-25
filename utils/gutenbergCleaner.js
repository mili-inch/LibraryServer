const { Transform } = require("stream");


const textStartMarkers = [
    "*END*THE SMALL PRINT",
    "*** START OF THE PROJECT GUTENBERG",
    "*** START OF THIS PROJECT GUTENBERG",
    "This etext was prepared by",
    "E-text prepared by",
    "Produced by",
    "Distributed Proofreading Team",
    "Proofreading Team at http://www.pgdp.net",
    "http://gallica.bnf.fr)",
    "      http://archive.org/details/",
    "http://www.pgdp.net",
    "by The Internet Archive)",
    "by The Internet Archive/Canadian Libraries",
    "by The Internet Archive/American Libraries",
    "public domain material from the Internet Archive",
    "Internet Archive)",
    "Internet Archive/Canadian Libraries",
    "Internet Archive/American Libraries",
    "material from the Google Print project",
    "*END THE SMALL PRINT",
    "***START OF THE PROJECT GUTENBERG",
    "This etext was produced by",
    "*** START OF THE COPYRIGHTED",
    "The Project Gutenberg",
    "http://gutenberg.spiegel.de/ erreichbar.",
    "Project Runeberg publishes",
    "Beginning of this Project Gutenberg",
    "Project Gutenberg Online Distributed",
    "Gutenberg Online Distributed",
    "the Project Gutenberg Online Distributed",
    "Project Gutenberg TEI",
    "This eBook was prepared by",
    "http://gutenberg2000.de erreichbar.",
    "This Etext was prepared by",
    "This Project Gutenberg Etext was prepared by",
    "Gutenberg Distributed Proofreaders",
    "Project Gutenberg Distributed Proofreaders",
    "the Project Gutenberg Online Distributed Proofreading Team",
    "**The Project Gutenberg",
    "*SMALL PRINT!",
    "More information about this book is at the top of this file.",
    "tells you about restrictions in how the file may be used.",
    "l'authorization à les utilizer pour preparer ce texte.",
    "of the etext through OCR.",
    "*****These eBooks Were Prepared By Thousands of Volunteers!*****",
    "We need your donations more than ever!",
    " *** START OF THIS PROJECT GUTENBERG",
    "****     SMALL PRINT!",
    '["Small Print" V.',
    '      (http://www.ibiblio.org/gutenberg/',
    'and the Project Gutenberg Online Distributed Proofreading Team',
    'Mary Meehan, and the Project Gutenberg Online Distributed Proofreading',
    '                this Project Gutenberg edition.',
    " <<THIS ELECTRONIC VERSION"
];

const textEndMarkers = [
    "*** END OF THE PROJECT GUTENBERG",
    "*** END OF THIS PROJECT GUTENBERG",
    "***END OF THE PROJECT GUTENBERG",
    "End of the Project Gutenberg",
    "End of The Project Gutenberg",
    "Ende dieses Project Gutenberg",
    "by Project Gutenberg",
    "End of Project Gutenberg",
    "End of this Project Gutenberg",
    "Ende dieses Projekt Gutenberg",
    "        ***END OF THE PROJECT GUTENBERG",
    "*** END OF THE COPYRIGHTED",
    "End of this is COPYRIGHTED",
    "Ende dieses Etextes ",
    "Ende dieses Project Gutenber",
    "Ende diese Project Gutenberg",
    "**This is a COPYRIGHTED Project Gutenberg Etext, Details Above**",
    "Fin de Project Gutenberg",
    "The Project Gutenberg Etext of ",
    "Ce document fut presente en lecture",
    "Ce document fut présenté en lecture",
    "More information about this book is at the top of this file.",
    "We need your donations more than ever!",
    "END OF PROJECT GUTENBERG",
    " End of the Project Gutenberg",
    " *** END OF THIS PROJECT GUTENBERG",
];


class StartRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._currentLine = 0;
        this._maxLine = 70;
        this._lineBuffers = [];
    }
    _transform(chunk, encoding, callback) {
        if (this._currentLine > this._maxLine) {
            if (this._lineBuffers.length > 0) {
                this._lineBuffers.forEach(x => this.push(x));
                this._lineBuffers = [];
            }
            this.push(chunk);
            callback();
            return;
        }
        this._currentLine += 1;
        this._lineBuffers.push(chunk);
        if (textStartMarkers.some(x => chunk.toString().startsWith(x))) {
            this._lineBuffers = [];
        }
        callback()
    }
    _flush(callback) {
        this._lineBuffers.forEach(x => this.push(x));
        callback();
    }
}

class EndRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._isEnded = false;
    }


    _transform(chunk, encoding, callback) {
        if (this._isEnded) {
            callback();
            return;
        }

        if (textEndMarkers.some(x => chunk.toString().startsWith(x))) {
            this._isEnded = true;
            callback();
            return;
        }

        this.push(chunk);
        callback();
    }
}

//段落入れ 一文中での不要な改行の削除
class NewLineSpacer extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._lineBuffers = [];
    }
    _transform(chunk, encoding, callback) {
        if (chunk.length == 0) {
            if (this._lineBuffers.length > 0) {
                this._flushBuffers();
            }
            this.push(Buffer.alloc(0));
        } else {
            if (chunk[0] == Buffer.from(" ")[0] || chunk[0] == Buffer.from("\t")[0]) {
                if (this._lineBuffers.length > 0) {
                    this._flushBuffers();
                }
                this._lineBuffers.push(chunk);
            } else {
                if (this._lineBuffers.length > 0) {
                    this._lineBuffers.push(Buffer.from(" "));
                }
                this._lineBuffers.push(chunk);
            }
        }
        callback();
    }
    _flushBuffers() {
        if (this._lineBuffers?.[0]?.[0] != Buffer.from(" ")[0] && this._lineBuffers?.[0]?.[0] != Buffer.from("\t")[0]) {
            this._lineBuffers.unshift(Buffer.from(" "));
        }
        this.push(Buffer.concat(this._lineBuffers));
        this._lineBuffers = [];
    }
    _flush(callback) {
        this.push(Buffer.concat(this._lineBuffers));
        callback();
    }
}

//一行の改行は消す
//二行以上の改行はそのまま残す
class NewLineRemover extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._voidCount = 0;
    }
    _transform(chunk, encoding, callback) {
        if (chunk.length == 0) {
            this._voidCount++;
        } else {
            if (this._voidCount > 1) {
                for (let i = 0; i < this._voidCount; i++) {
                    this.push(Buffer.alloc(0));
                }
            }
            this._voidCount = 0;
            this.push(chunk);
        }
        callback();
    }
}

class LineJoint extends Transform {
    constructor() {
        super({ writableObjectMode: true, readableObjectMode: true });
        this._isFirstChunk = true;
    }
    _transform(chunk, encoding, callback) {
        if (!this._isFirstChunk) {
            this.push(Buffer.from("\n"));
        }
        this._isFirstChunk = false;
        this.push(chunk);
        callback();
    }
}

module.exports = {
    StartRemover, EndRemover, NewLineSpacer, NewLineRemover, LineJoint
}