import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/auth/login(.*)", "/s/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
	if (isPublicRoute(request)) {
		if (request.nextUrl.pathname === "/auth/login") {
			const { userId } = await auth();
			if (userId) return NextResponse.redirect(new URL("/", request.url));
		}
		return;
	}

	const { userId } = await auth();
	if (userId) return;

	if (request.nextUrl.pathname.startsWith("/api/")) {
		return NextResponse.json(
			{ error: "User not authenticated" },
			{ status: 401 }
		);
	}

	const url = request.nextUrl.clone();
	url.pathname = "/auth/login";
	return NextResponse.redirect(url);
});

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/",
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
