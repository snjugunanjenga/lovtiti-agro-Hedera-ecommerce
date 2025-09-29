import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
	publicRoutes: ["/", "/auth/login(.*)", "/auth/signup(.*)", "/auth/logout", "/hedera-test"],
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
