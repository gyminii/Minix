type PageRoutesType = {
	title: string;
	items: PageRoutesItemType;
};

type PageRoutesItemType = {
	title: string;
	href: string;
	icon?: string;
	isComing?: boolean;
	isNew?: boolean;
	newTab?: boolean;
	items?: PageRoutesItemType;
}[];
export const page_routes: PageRoutesType[] = [
	{
		title: "Drive",
		items: [
			{
				title: "Home",
				href: "/",
				icon: "House",
			},
			{
				title: "Drive",
				href: "/drive",
				icon: "SquareKanban",
			},
			{
				title: "Paste",
				href: "/paste",
				icon: "Clipboard",
			},
		],
	},
];
