const processAozoraQuery = x => {
    const item = x.dataValues;
    item.source = "aozora";
    item.authorBirthYear = item?.authorBirthDate?.getFullYear() ?? "?";
    item.authorDeathYear = item?.authorDeathDate?.getFullYear() ?? "?";
    item.releaseDate = item?.releaseDate?.toDateString() ?? "?";
    delete item.authorBirthDate;
    delete item.authorDeathDate;
    delete item.id;
    delete item.titleKanaForSort;
    delete item.authorNameKanaForSort;
    delete item.textFileUrl;
    delete item.createdAt;
    delete item.updatedAt;
    return item;
}

const processGutenbergQuery = x => {
    const item = {};
    item.source = "gutenberg";
    item.bookId = x.id + "";
    item.title = x.title;
    item.titleKana = "";
    item.authorName = x?.authors?.[0]?.name ?? "?";
    item.authorNameKana = "";
    item.authorBirthYear = x?.authors?.[0]?.birth_year ?? "?";
    item.authorDeathYear = x?.authors?.[0]?.death_year ?? "?";
    item.releaseDate = "?";
    return item;
}

const processQueryToTSV = x => {
    return x.source + "\t" + x.bookId + "\t" + x.title + "\t" + x.authorName + "\t" + x.authorBirthYear + "\t" + x.authorDeathYear;
}

module.exports = {
    processAozoraQuery: processAozoraQuery,
    processGutenbergQuery: processGutenbergQuery,
    processQueryToTSV: processQueryToTSV
}