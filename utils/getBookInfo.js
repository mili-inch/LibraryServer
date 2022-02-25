const { processAozoraQuery, processGutenbergQuery } = require("./queryProcessing");
const { searchAozoraBookFromId } = require("./searchAozora");
const { isValidBookId, isValidSource } = require("./validation");

const getBookInfo = async (source, id) => {
    if (!isValidSource(source) || !isValidBookId(id)) {
        return null;
    }
    if (source == "aozora") {
        const book = await searchAozoraBookFromId(Number(id));
        if (!book) {
            return null;
        }
        const response = processAozoraQuery(book);
        return response;
    }
    if (source == "gutenberg") {
        try {
            const result = await axios({
                method: "get",
                url: "http://localhost:8000/books/" + Number(id)
            });
            const response = processGutenbergQuery(result.data);
            return response;
        } catch (e) {
            return null;
        }
    }
}

module.exports = getBookInfo;