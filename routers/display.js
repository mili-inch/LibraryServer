const express = require("express");
const router = express.Router();
const axios = require("axios");

const { isValidSource, isValidBookId, isValidOrder } = require("../utils/validation");
const { User, Book, StoredBook, PickedBook, Shelf, Display } = require("../model.js");
const getBookInfo = require("../utils/getBookInfo");


router.post("/create", (req, res, next) => {
    const { title, order, source, id } = req.query;
    if (!title || !isValidSource(source) || !isValidBookId(id) || !isValidOrder(order)) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const bookInfo = getBookInfo(source, id);
        if (!bookInfo) {
            res.status(404);
            res.send("Book not found");
            return next();
        }

        const [display, displayCreated] = await Display.findOrCreate({ where: { title: title } });

        const [book, bookCreated] = await Book.findOrCreate({
            where: {
                source: source,
                bookId: id
            },
            defaults: {
                source: source,
                bookId: id,
                title: bookInfo.title,
                autorName: bookInfo.authorName
            }
        });
        const storedBook = await StoredBook.create({ order: Number(order) });
        storedBook.setBook(book);
        display.addStoredBook(storedBook);
        book.addStoredBook(storedBook);
    })().then().catch(next);
});

router.get("/list", (req, res, next) => {
    const { title } = req.query;
    if (!title) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const display = await Display.findOne({
            where: { title: title },
            include: [
                {
                    model: StoredBook,
                    as: "storedBooks",
                    include: {
                        model: Book,
                        as: "book"
                    }
                }
            ]
        });
        if (!display) {
            res.status(404);
            res.send("Display not found");
            return next();
        }
        res.send(display.storedBooks.map(x => x.book));
    })().then().catch(next);
});

module.exports = router;