const express = require("express");
const router = express.Router();
const { User, Book, PickedBook, Shelf, StoredBook } = require("../model");
const getBookInfo = require("../utils/getBookInfo");
const { isValidSource, isValidBookId } = require("../utils/validation")


router.post("/password/create", (req, res, next) => {
    const { user: userId, password } = req.query;
    if (!userId || !password) {
        res.status(400)
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const [user, created] = await User.findOrCreate({ where: { userId: userId } });
        if (user.password) {
            res.status = 400;
            res.send("To update password, send message to bot");
            return next();
        }
        user.set("password", password);
        await user.save();
        res.send("created");
    })().then().catch(next);
});

router.post("/pickedBook/create", (req, res, next) => {
    const { user: userId, source, id } = req.query;
    if (!userId || !isValidBookId(id) || !isValidSource(source)) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const [user, userCreated] = await User.findOrCreate({ where: { userId: userId } });
        const bookInfo = await getBookInfo(source, id);
        if (!bookInfo) {
            res.status(404);
            res.send("Book not found");
            return next();
        }
        const [book, bookCreated] = await Book.findOrCreate({
            where: { source: source, bookId: id },
            defaults: {
                source: source,
                bookId: id,
                title: bookInfo.title,
                autorName: bookInfo.authorName
            }
        });
        const pickedBook = await PickedBook.create({ status: "picked" });
        pickedBook.setBook(book);
        pickedBook.setUser(user);
        user.addPickedBook(pickedBook);
        book.addPickedBook(pickedBook);
    })().then().catch(next);
});

router.get("/pickedBook/list", (req, res, next) => {
    const { user: userId } = req.query;
    if (!userId) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const user = await User.findOne({
            where: { userId: userId },
            include: [
                {
                    model: PickedBook,
                    as: "pickedBooks",
                    include: {
                        model: Book,
                        as: "book"
                    }
                }
            ]
        });
        if (!user) {
            res.status(404);
            res.send("User not found");
            return next();
        }
        res.send(user.pickedBooks.map(x => x.book));
    })().then().catch(next);
});

/*
router.get("/shelf/list", (req, res, next) => {
    const { user: userId } = req.query;
    if (!userId) {
        res.status(400);
        res.send("Bad Request");
        return next();
    }
    (async () => {
        const user = await User.findOne({
            where: { userId: userId },
            include: [
                {
                    model: Shelf,
                    as: "shelves"
                }
            ]
        });
        if (!user) {
            res.status(404);
            res.send("User not found");
            return next();
        }
        res.send(user.shelves.map(x => x.title));
    })().then().catch(next);
});

router.post("/update");
router.post("/delete");
router.post("/create");*/

module.exports = router;