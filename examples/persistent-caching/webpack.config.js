const path = require("path");
module.exports = {
	cache: {
		cacheDirectory: path.resolve(__dirname, "dist/cache"),
		warn: true
	}
};
