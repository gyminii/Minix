import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	{
		ignores: [
			".next/**",
			".open-next/**",
			".wrangler/**",
			"out/**",
			"node_modules/**",
			"cloudflare-env.d.ts",
		],
	},

	...nextCoreWebVitals,
	...nextTypescript,

	// Add an override for shadcn components
	{
		files: ["components/ui/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@next/next/no-img-element": "off",
		},
	},

	// Add an override for API routes
	{
		files: ["app/api/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
];

export default eslintConfig;
