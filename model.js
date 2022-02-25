const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
    "YourDatabaseName",
    "YourUserName",
    "YourPassword",
    {
        host: "localhost",
        dialect: "postgres",
        logging: false
    }
);

const crypto = require("crypto");

const salt = "SecretPhrase";

const AozoraBook = sequelize.define("AozoraBook",
    {
        bookId: {
            type: DataTypes.INTEGER,
            unique: true
        },
        title: {
            type: DataTypes.STRING(510)
        },
        titleKana: {
            type: DataTypes.STRING(510)
        },
        titleKanaForSort: {
            type: DataTypes.STRING(510)
        },
        authorName: {
            type: DataTypes.STRING
        },
        authorNameKana: {
            type: DataTypes.STRING
        },
        authorNameKanaForSort: {
            type: DataTypes.STRING
        },
        authorBirthDate: {
            type: DataTypes.DATE
        },
        authorDeathDate: {
            type: DataTypes.DATE
        },
        releaseDate: {
            type: DataTypes.DATE
        },
        textFileUrl: {
            type: DataTypes.STRING
        }
    }
);

const User = sequelize.define("User",
    {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            set(value) {
                const hash = crypto.createHash("sha256").update(salt + value + salt).digest("hex");
                this.setDataValue("password", hash);
            }
        }
    }
);

const Book = sequelize.define("Book",
    {
        source: {
            type: DataTypes.ENUM,
            values: ["gutenberg", "aozora"],
            allowNull: false
        },
        bookId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        authorName: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
);

const StoredBook = sequelize.define("StoredBook",
    {
        order: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }
);

const PickedBook = sequelize.define("PickedBook",
    {
        status: {
            type: DataTypes.STRING
        }
    }
)

const Shelf = sequelize.define("Shelf",
    {
        title: {
            type: DataTypes.STRING,
            defaultValue: "No Name"
        }
    }
);

const Display = sequelize.define("Display",
    {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
);

User.belongsToMany(Shelf, { through: "UserShelves" });
User.belongsToMany(PickedBook, { through: "UserPickedBooks" });

Book.belongsToMany(PickedBook, { through: "BookPickedBooks" });
Book.belongsToMany(StoredBook, { through: "BookStoredBooks" });
PickedBook.belongsTo(Book);
PickedBook.belongsTo(User);
StoredBook.belongsTo(Book);
StoredBook.belongsTo(Shelf);

Shelf.belongsTo(User);
Shelf.belongsToMany(StoredBook, { through: "ShelfStoredBooks" });
Display.belongsToMany(StoredBook, { through: "DisplayStoredBooks" })

sequelize.sync();

module.exports = {
    AozoraBook: AozoraBook,
    User: User,
    Book: Book,
    StoredBook: StoredBook,
    PickedBook: PickedBook,
    Shelf: Shelf,
    Display: Display
}




//User belongsToMany Shelf (Shelves the user created)
//User belongsToMany PickedBook (Books the user picked)
//PickedBook belongsTo QueliedBook (The statement of book which the picked book instanced)
//QueliedBook belongsToMany User (Users who read the book)
//QueliedBook belongsToMany Shelf (Shelves which contain the book)
//Shelf belongsTo User (The user who created the shelf)
//Shelf belongsToMany StoredBook (Books which the shelf contained)
//StoredBook belongsTo QueliedBook (The statement of book which the stored book instanced)
//DisplayShelf belongsToMany StoredBook (Books which the displays contained)