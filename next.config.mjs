// next.config.mjs
import nextPWA from "next-pwa";

const withPWA = nextPWA({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	i18n: undefined,
	compiler: {
		removeConsole: process.env.NODE_ENV !== "development",
	},
};

export default withPWA(nextConfig);
