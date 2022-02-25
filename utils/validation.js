const isValidSource = (source) => (source == "aozora" || source == "gutenberg");

const isValidBookId = (id) => (id && !Number.isNaN(id) && Number(id) >= 0);

const isValidOrder = (order) => (order && !Number.isNaN(order) && Number(order) >= 0);

module.exports = {
    isValidSource, isValidBookId, isValidOrder
}