const { Op } = require("sequelize");

const { AozoraBook } = require("../model.js");

//require: search, sort, limit, page
//optional: author_year_start author_year_end
const searchAozoraBooks = async (query) => {
    const { search, author_year_start, author_year_end, sort, limit, page } = query;

    const andParameter = search.split(" ").map(x => {
        const searchKeys = ["title", "titleKana", "authorName", "authorNameKana"];
        const orParameters = searchKeys.reduce((prev, cur) => {
            prev.push({ [cur]: { [Op.substring]: x } });
            return prev;
        }, []);
        return { [Op.or]: orParameters };
    }).reduce((prev, cur) => {
        prev.push(cur)
        return prev;
    }, []);
    if (author_year_start && !Number.isNaN(author_year_start) && 0 <= author_year_start && author_year_start < 3000) {
        andParameter.push({ authorDeathDate: { [Op.gt]: new Date(author_year_start + "") } })
    }
    if (author_year_end && !Number.isNaN(author_year_end) && 0 <= author_year_end && author_year_end < 3000) {
        andParameter.push({ authorBirthDate: { [Op.lt]: new Date(author_year_end + "") } })
    }
    const order = [];
    if (sort == "ascending") {
        order.push(["releaseDate", "ASC"]);
    }
    if (sort == "descending") {
        order.push(["releaseDate", "DESC"]);
    }
    if (sort == "lastname") {
        order.push(["authorNameKana", "ASC"]);
    }

    const result = await AozoraBook.findAll({
        where: { [Op.and]: andParameter },
        //        order: order,
        offset: page * limit,
        limit: limit
    })
    return result;
}

const searchAozoraBookFromId = async (id) => {
    const result = await AozoraBook.findOne({
        where: {
            bookId: id
        }
    });
    return result;
}

module.exports = {
    searchAozoraBooks: searchAozoraBooks,
    searchAozoraBookFromId: searchAozoraBookFromId

}