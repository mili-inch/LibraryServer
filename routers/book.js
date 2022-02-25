const express = require("express");
const router = express.Router();
const axios = require("axios");

const { isValidSource, isValidBookId, isValidOrder } = require("../utils/validation");
const { processAozoraQuery, processGutenbergQuery, processQueryToTSV } = require("../utils/queryProcessing");
const { searchAozoraBooks, searchAozoraBookFromId } = require("../utils/searchAozora");
const { Book, PickedBook, User } = require("../model");

//get infos from indivisual dbs and append info from queliedbook
//required: source search
//optional: author_year_start, author_year_end, languages, sort, page
//return source,bookId,title,authorName,authorBirthYear,authorDeathYear (TSV)
router.get("/list", (req, res, next) => {
    const limit = 32;
    const { source, search, author_year_start, author_year_end, languages, sort, page } = req.query;
    if (!isValidSource(source) || search === undefined) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }

    if (source == "aozora") {
        const query = { search: search, limit: limit }
        //required queries
        if (sort) {
            query.sort = sort;
        } else {
            query.sort = "lastname";
        }
        if (page && !Number.isNaN(page) && page >= 0) {
            query.page = Number(page);
        } else {
            query.page = 0;
        }
        //optional queries
        if (author_year_start && !Number.isNaN(author_year_start)) {
            query.author_year_start = Number(author_year_start);
        }
        if (author_year_end && !Number.isNaN(author_year_end)) {
            query.author_year_end = Number(author_year_end);
        }

        (async () => {
            let result = await searchAozoraBooks(query);
            result = result.map(processAozoraQuery);
            result = result.map(processQueryToTSV);
            res.send(result.join("\n"));
            return next();
        })().then(() => { return; }).catch(next);
    }

    if (source == "gutenberg") {
        const query = {
            mime_type: "text/plain",
            search: search,
        }
        if (author_year_start && !Number.isNaN(author_year_start)) {
            query.author_year_start = author_year_start;
        }
        if (author_year_end && !Number.isNaN(author_year_end)) {
            query.author_year_end = author_year_end;
        }
        if (languages) {
            query.languages = languages;
        }
        if (sort) {
            query.sort = sort;
        }
        if (page && !Number.isNaN(page) && page >= 1) {
            query.page = page;
        } else {
            query.page = "1";
        }

        const queryString = Object.entries(query)
            .map(x => [x[0], encodeURIComponent(x[1])])
            .map(x => x[0] + "=" + x[1])
            .join("&");
        (async () => {
            try {
                const result = await axios({
                    method: "get",
                    url: "http://localhost:8000/books/?" + queryString
                });
                const response = result.data.results.map(processGutenbergQuery).map(processQueryToTSV);
                res.send(response.join("\n"));
            } catch (e) {
                res.status(500);
                res.send("server error");
                return next();
            }
        })().then(() => { return; }).catch(next);
    }
});

router.get("/pickedUser/list", (req, res, next) => {
    const { source, id: bookId } = req.query;
    if (!isValidSource(source) || !isValidBookId(bookId)) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const book = await Book.findOne({
            where: { source: source, bookId: bookId },
            include: {
                model: PickedBook,
                as: "pickedBooks",
                include: {
                    model: User,
                    as: "user"
                }
            }
        });
        if (!book) {
            res.status(404);
            res.send("No one has read yet");
            return next();
        }
        res.send(book.pickedBooks.map(x => x.user.userId));
    })().then().catch(next);
})

module.exports = router;