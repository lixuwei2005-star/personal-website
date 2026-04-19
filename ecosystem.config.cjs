module.exports = {
	apps: [
		{
			name: "mizuki",
			script: "dist/server/entry.mjs",
			env: {
				HOST: "0.0.0.0",
				PORT: 4321,
				NODE_ENV: "production",
			},
			instances: 1,
			autorestart: true,
			max_memory_restart: "512M",
		},
	],
};
