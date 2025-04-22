import { Metadata } from "next";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as d3 from "d3-color";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
	const names = string.split(" ").filter((name: string) => name);
	const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

	return mapped.join("");
}

export function generateMeta({
	title,
	description,
	canonical,
}: {
	title: string;
	description: string;
	canonical: string;
}): Metadata {
	return {
		title: `${title} - Shadcn UI Kit`,
		description: description,
		metadataBase: new URL(`${process.env.BASE_URL}`),
		alternates: {
			canonical: `/dashboard${canonical}`,
		},
		openGraph: {
			images: [`${process.env.ASSETS_URL}/seo.jpg`],
		},
	};
}

export function getHSLValue(hex: string): string {
	return d3.color(hex)!.formatHsl().slice(4, -1).replaceAll(",", "");
}

// a function to get the first letter of the first and last name of names
export const getInitials = (fullName: string) => {
	const nameParts = fullName.split(" ");
	const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
	const lastNameInitial = nameParts[1].charAt(0).toUpperCase();
	return `${firstNameInitial}${lastNameInitial}`;
};
