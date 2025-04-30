"use client";

import { motion } from "framer-motion";
import { FolderListCards, SummaryCards, TableRecentFiles } from "../components";

import Link from "next/link";

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.2,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 20,
		},
	},
};

const titleVariants = {
	hidden: { opacity: 0, y: -20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
		},
	},
};

const ClientPage = () => {
	return (
		<motion.div
			className="space-y-4"
			variants={containerVariants}
			initial="hidden"
			animate="show"
		>
			<motion.div className="w-full" variants={itemVariants} custom={0}>
				<TableRecentFiles />
			</motion.div>

			<motion.div variants={itemVariants} custom={1} className="w-full">
				<SummaryCards />
			</motion.div>

			<motion.h3
				className="text-lg font-bold tracking-tight lg:text-xl cursor-pointer hover:text-primary"
				variants={titleVariants}
				custom={2}
			>
				<Link href="/drive">Recently added folders</Link>
			</motion.h3>

			<motion.div className="mb-4 w-full" variants={itemVariants} custom={3}>
				<FolderListCards />
			</motion.div>
		</motion.div>
	);
};

export default ClientPage;
