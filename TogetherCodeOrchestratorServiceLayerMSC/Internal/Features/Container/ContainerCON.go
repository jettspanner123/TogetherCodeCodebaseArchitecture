package container

// Container domain constants and defaults.
const (
	DEFAULT_OPENVSCODE_IMAGE     = "gitpod/openvscode-server:latest"
	CONTAINER_INTERNAL_PORT      = "3000"
	CONTAINER_LABEL_APP          = "togethercode"
	CONTAINER_LABEL_MANAGED_BY   = "TogetherCodeOrchestratorServiceLayerMSC"
	CONTAINER_MEMORY_LIMIT_BYTES = 1610612736 // 1.5 GB
	CONTAINER_NANO_CPUS          = 1000000000 // 1.0 CPU Core

	STARTER_README_ROOT = "# TogetherCode Collaborative Workspace\n\nWelcome to your shared pairing session!\n- UserOne files: `/home/workspace/UserOne`\n- UserTwo files: `/home/workspace/UserTwo`\n- Shared files: `/home/workspace/shared`\n\nBoth users have full read, write, and terminal execution access across the workspace.\n"

	STARTER_USER_ONE_PY = "# UserOne Workspace\n# Write your code below and run using the integrated terminal.\n\ndef solution():\n    print(\"Hello from UserOne!\")\n\nif __name__ == '__main__':\n    solution()\n"
	STARTER_USER_TWO_PY = "# UserTwo Workspace\n# Write your code below and run using the integrated terminal.\n\ndef solution():\n    print(\"Hello from UserTwo!\")\n\nif __name__ == '__main__':\n    solution()\n"

	STARTER_USER_ONE_JS = "// UserOne Workspace\n// Write your JavaScript/TypeScript code below.\n\nfunction solution() {\n  console.log('Hello from UserOne!');\n}\n\nsolution();\n"
	STARTER_USER_TWO_JS = "// UserTwo Workspace\n// Write your JavaScript/TypeScript code below.\n\nfunction solution() {\n  console.log('Hello from UserTwo!');\n}\n\nsolution();\n"

	STARTER_SHARED_NOTES = "# Shared Scratchpad & Notes\nUse this file to share algorithms, test cases, or problem statements with your peer.\n"
)
