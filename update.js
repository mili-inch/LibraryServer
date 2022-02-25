const { AozoraBook } = require("./model.js");
const execSync = require("child_process").execSync;
const fs = require("fs");
const csv = require("csv-parser");
const stripBom = require("strip-bom-stream");

const aozoraCsvUrl = "https://www.aozora.gr.jp/index_pages/list_person_all_extended_utf8.zip"
console.log(__dirname)

execSync(
    "curl -o ./assets/index.zip " + aozoraCsvUrl,
    { cwd: __dirname }
);
execSync(
    "unzip -o -j -d ./assets ./assets/index.zip",
    { cwd: __dirname }
);

fs.createReadStream(__dirname + "/assets/list_person_all_extended_utf8.csv")
    .pipe(stripBom())
    .pipe(csv())
    .on("data", (data) => {
        if (!/https?:\/\/www.aozora.gr.jp\/cards\/\d+\/files\/\w+\.zip/.test(data.テキストファイルURL)) {
            return;
        }
        const dateRegex = /^\d+(-\d+(-\d+)?)?$/;
        let birthDate = null;
        if (dateRegex.test(data.生年月日)) {
            birthDate = new Date(data.生年月日);
        }
        let deathDate = null;
        if (dateRegex.test(data.没年月日)) {
            deathDate = new Date(data.没年月日);
        }
        let releaseDate = null;
        if (dateRegex.test(data.公開日)) {
            releaseDate = new Date(data.公開日);
        }

        const item = {
            bookId: Number(data.作品ID),
            title: data.副題 ? data.作品名 + " " + data.副題 : data.作品名,
            titleKana: data.作品名読み + data.副題読み,
            titleKanaForSort: data.ソート用読み,
            authorName: data.姓 + data.名,
            authorNameKana: data.姓読み + data.名読み,
            authorNameKanaForSort: data.姓読みソート用 + data.名読みソート用,
            authorBirthDate: birthDate,
            authorDeathDate: deathDate,
            releaseDate: releaseDate,
            textFileUrl: data.テキストファイルURL
        }

        AozoraBook.upsert(item).then().catch((e) => { console.log(item); throw new Error(e) });
    })
    .on("error", (err) => {
        console.log(err);
    })
    .on("end", (args) => {

    });