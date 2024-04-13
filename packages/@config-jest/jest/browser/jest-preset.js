module.exports = {
	roots: ["<rootDir>"],
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.tsx?$": "ts-jest",
		"^.+\\.ts?$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	modulePathIgnorePatterns: ["<rootDir>/test/__fixtures__", "<rootDir>/node_modules", "<rootDir>/dist"],
	preset: "ts-jest",
};