"use client";

import { motion } from "framer-motion";
import { Construction, Clock, Clipboard, Code } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PastePage() {
	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: "spring",
				stiffness: 260,
				damping: 20,
			},
		},
	};

	const handleNotifyMe = () => {
		toast.success("You'll be notified when the Pastebin feature is ready!");
	};

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<motion.div
				className="space-y-8"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<motion.div variants={itemVariants} className="text-center">
					<Construction className="mx-auto h-24 w-24 text-primary" />
					<h1 className="mt-6 text-4xl font-bold tracking-tight">
						Pastebin Feature Coming Soon
					</h1>
					<p className="mt-4 text-xl text-muted-foreground">
						I&apos;m working hard to bring you a powerful pastebin feature
					</p>
				</motion.div>

				<motion.div variants={itemVariants}>
					<Card>
						<CardHeader>
							<CardTitle>What to Expect</CardTitle>
							<CardDescription>
								Our pastebin feature will allow you to quickly share code
								snippets and text
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<div className="flex items-start space-x-4">
									<div className="rounded-full bg-primary/10 p-2">
										<Code className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium">Syntax Highlighting</h3>
										<p className="text-sm text-muted-foreground">
											Support for multiple programming languages with beautiful
											syntax highlighting
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-4">
									<div className="rounded-full bg-primary/10 p-2">
										<Clock className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium">Expiration Options</h3>
										<p className="text-sm text-muted-foreground">
											Set your pastes to expire after a certain time period
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-4">
									<div className="rounded-full bg-primary/10 p-2">
										<Clipboard className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="font-medium">Private Sharing</h3>
										<p className="text-sm text-muted-foreground">
											Share pastes privately with specific users or make them
											public
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-4">
									<div className="rounded-full bg-primary/10 p-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="h-5 w-5 text-primary"
										>
											<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
											<path d="M10 2c1 .5 2 2 2 5" />
										</svg>
									</div>
									<div>
										<h3 className="font-medium">Markdown Support</h3>
										<p className="text-sm text-muted-foreground">
											Format your text with Markdown for better readability
										</p>
									</div>
								</div>
							</div>

							<div className="mt-8 flex justify-center">
								<div className="w-full max-w-md space-y-2">
									<div className="relative pt-1">
										<div className="flex mb-2 items-center justify-between">
											<div>
												<span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary text-primary-foreground">
													In Progress
												</span>
											</div>
											<div className="text-right">
												<span className="text-xs font-semibold inline-block text-primary">
													65%
												</span>
											</div>
										</div>
										<div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: "65%" }}
												transition={{ duration: 1, delay: 0.5 }}
												className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
											/>
										</div>
									</div>

									<Button onClick={handleNotifyMe} className="w-full">
										Notify Me When It is Ready
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
