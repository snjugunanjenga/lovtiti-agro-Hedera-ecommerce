'use client';
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
	return (
		<main className="p-8 flex justify-center">
			<SignUp routing="hash" />
		</main>
	);
}
