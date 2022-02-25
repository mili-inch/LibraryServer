const express = require("express");
const router = express.Router();
const axios = require("axios");
const Iconv = require("iconv").Iconv;
const { LineStream } = require("byline");
const stream = require("stream");

const { StartRemover, EndRemover, NewLineSpacer, NewLineRemover, LineJoint } = require("../utils/gutenbergCleaner");
const { ToStringify, ToBufferify, ChukiRemover, GaijiTranslator, KigouRemover, DescriptionRemover } = require("../utils/aozoraCleaner")
const { isValidSource, isValidBookId, isValidOrder } = require("../utils/validation");
const { searchAozoraBooks, searchAozoraBookFromId } = require("../utils/searchAozora");

router.get("/get", (req, res, next) => {
    const { source, id } = req.query;
    if (!isValidSource(source) || !isValidBookId(id)) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    if (source == "aozora") {
        (async () => {
            const book = await searchAozoraBookFromId(Number(id));
            if (!book) {
                res.status(404);
                res.send("book not found");
                return next();
            }
            let url = "https://aozorahack.org/aozorabunko_text/" +
                book.textFileUrl.split("https://www.aozora.gr.jp/")[1].split(".")[0] + "/" +
                book.textFileUrl.split("/").slice(-1)[0].split(".")[0] + ".txt";
            const response = await axios({ method: "get", url: url, responseType: "stream" });
            if (response.status === 200) {
                const iconv = new Iconv("SHIFT_JIS", "UTF-8");
                const lineStream = new LineStream({ keepEmptyLines: true });
                const lineJoint = new LineJoint();
                const toStringify = new ToStringify();
                const toBufferify = new ToBufferify();
                const kigouRemover = new KigouRemover();
                const chukiRemover = new ChukiRemover();
                const gaijiTranslator = new GaijiTranslator();
                const descriptionRemover = new DescriptionRemover();
                response.data
                    .pipe(iconv)
                    .pipe(lineStream)
                    .pipe(toStringify)
                    .pipe(descriptionRemover)
                    .pipe(kigouRemover)
                    .pipe(gaijiTranslator)
                    .pipe(chukiRemover)
                    .pipe(toBufferify)
                    .pipe(lineJoint)
                    .pipe(res);
            } else {
                res.status(404);
                res.send("text not found");
                return next();
            }
        })().then(() => { return; }).catch(next);
    }
    if (source == "gutenberg") {
        (async () => {
            let result;
            try {
                result = await axios({
                    method: "get",
                    url: "http://localhost:8000/books/" + id
                });
            } catch (e) {
                res.status(404);
                res.send("book not found");
                return next();
            }

            let url = result.data.formats["text/plain"];
            if (!url?.endsWith("txt")) {
                url = result.data.formats["text/plain; charset=utf-8"];
            }
            if (!url?.endsWith("txt")) {
                url = result.data.formats["text/plain; charset=us-ascii"];
            }
            if (!url?.endsWith("txt")) {
                url = result.data.formats["text/plain; charset=utf-8"]?.replace(/zip$/, "txt");
            }
            if (!url) {
                url = "https://www.gutenberg.org/files/" + id + "/" + id + ".txt";
            }
            const response = await axios({ method: "get", url: url, responseType: "stream" });
            if (response.status === 200) {
                const startRemover = new StartRemover();
                const endRemover = new EndRemover();
                const lineStream = new LineStream({ keepEmptyLines: true });
                const lineJoint = new LineJoint();
                const newLineRemover = new NewLineRemover();
                const newLineSpacer = new NewLineSpacer();
                response.data
                    .pipe(lineStream)
                    .pipe(startRemover)
                    .pipe(endRemover)
                    .pipe(newLineSpacer)
                    .pipe(newLineRemover)
                    .pipe(lineJoint)
                    .pipe(res);
            } else {
                res.status(404);
                res.send("text not found");
                return next();
            }
        })().then(() => { return; }).catch(next);
    }
});

module.exports = router;