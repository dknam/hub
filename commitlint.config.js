module.exports = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		// 커스텀 규칙을 여기에 추가할 수 있습니다.
		// 예를 들어, 커밋 메시지 길이를 제한하는 규칙을 추가할 수 있습니다.
		"header-max-length": [2, "always", 100],
	},
};
