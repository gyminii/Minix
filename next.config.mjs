import withPWA from "./lib/pwa.cjs";

const nextConfig = {
	/* config options here */
	i18n: undefined,
	compiler: {
		removeConsole: process.env.NODE_ENV !== "development",
	},
};

export default withPWA({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
})(nextConfig);
