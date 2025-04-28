"use client";

import type React from "react";

import { LoginForm } from "@/components/login-form";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// Animated background blob component
const AnimatedBlob = ({
	className,
	initialX,
	initialY,
	size = 400,
	mobileSize,
	color = "rgba(96, 165, 250, 0.2)",
	duration = 20,
}: {
	className?: string;
	initialX: number;
	initialY: number;
	size?: number;
	mobileSize?: number;
	color?: string;
	duration?: number;
}) => {
	const isMobile = useIsMobile();
	const actualSize = isMobile && mobileSize ? mobileSize : size;

	return (
		<motion.div
			className={`absolute rounded-full blur-3xl ${className}`}
			style={{
				width: actualSize,
				height: actualSize,
				background: color,
				x: initialX,
				y: initialY,
			}}
			animate={{
				x: [initialX, initialX + 30, initialX - 30, initialX],
				y: [initialY, initialY - 30, initialY + 40, initialY],
			}}
			transition={{
				duration,
				repeat: Number.POSITIVE_INFINITY,
				repeatType: "reverse",
				ease: "easeInOut",
			}}
		/>
	);
};

// Hover-animated icon component
const HoverIcon = ({
	icon,
	label,
	delay = 0,
	className = "",
}: {
	icon: React.ReactNode;
	label: string;
	delay?: number;
	className?: string;
}) => {
	return (
		<motion.div
			className="flex flex-col items-center justify-center w-20 group cursor-pointer"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.5 }}
		>
			<motion.div
				className={`flex items-center justify-center rounded-full bg-primary/10 p-3 transition-all duration-300 group-hover:bg-primary/20 ${className}`}
				whileHover={{
					y: -8,
					scale: 1.05,
					transition: { duration: 0.2 },
				}}
			>
				{icon}
			</motion.div>
			<motion.div
				className="mt-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-primary"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.2, duration: 0.5 }}
			>
				{label}
			</motion.div>
		</motion.div>
	);
};

export default function Page() {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const isMobile = useIsMobile();
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

	// Handle window resize and initial size
	useEffect(() => {
		function handleResize() {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}

		// Set initial size
		handleResize();

		// Add event listener
		window.addEventListener("resize", handleResize);

		// Clean up
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-sm">
					<LoginForm />
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-gradient-to-b from-background to-background">
			{/* Animated Background Blobs */}
			<div className="absolute inset-0 z-0 overflow-hidden">
				<AnimatedBlob
					initialX={-100}
					initialY={-50}
					size={600}
					mobileSize={300}
					color="rgba(96, 165, 250, 0.1)"
					duration={25}
				/>
				<AnimatedBlob
					initialX={windowSize.width - 200}
					initialY={windowSize.height - 200}
					size={500}
					mobileSize={250}
					color="rgba(129, 140, 248, 0.1)"
					duration={20}
				/>
				<AnimatedBlob
					initialX={windowSize.width / 2 - 100}
					initialY={windowSize.height / 2 - 150}
					size={400}
					mobileSize={200}
					color="rgba(52, 211, 153, 0.08)"
					duration={30}
				/>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(120,120,255,0.05),transparent_60%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(90,200,255,0.08),transparent_50%)]"></div>
			</div>

			{/* Content */}
			<div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-6xl mx-auto">
					{/* Grid layout - vertical on mobile, horizontal on desktop */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
						{/* Left side: Branding */}
						<motion.div
							className="flex flex-col items-center justify-center text-center md:items-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
						>
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
								className="flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-full bg-primary/10"
								whileHover={{
									scale: 1.05,
									backgroundColor: "rgba(var(--primary), 0.2)",
									transition: { duration: 0.2 },
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="h-8 w-8 md:h-12 md:w-12 text-primary"
								>
									<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
									<path d="M18 14h-8" />
									<path d="M15 18h-5" />
									<path d="M10 6h8v4h-8V6Z" />
								</svg>
							</motion.div>

							<motion.h1
								className="mt-4 text-2xl md:text-4xl font-bold tracking-tight md:mt-6 md:text-5xl"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5, duration: 0.8 }}
							>
								Minix Drive
							</motion.h1>

							<motion.p
								className="text-muted-foreground mx-auto max-w-sm text-sm md:text-lg mt-2 md:mt-4"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.7, duration: 0.8 }}
							>
								Securely store, share, and manage all your files in one place.
							</motion.p>

							{/* Feature Icons - Hover animation instead of continuous */}
							<motion.div
								className="mt-6 md:mt-12 flex justify-center w-full"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.9, duration: 0.5 }}
							>
								<div className="flex justify-center space-x-8 md:space-x-12 w-full max-w-xs mx-auto">
									<HoverIcon
										delay={1.1}
										icon={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width={isMobile ? "18" : "24"}
												height={isMobile ? "18" : "24"}
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className="text-primary"
											>
												<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
												<polyline points="3.29 7 12 12 20.71 7"></polyline>
												<line x1="12" y1="22" x2="12" y2="12"></line>
											</svg>
										}
										label="Secure"
									/>

									<HoverIcon
										delay={1.3}
										icon={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width={isMobile ? "18" : "24"}
												height={isMobile ? "18" : "24"}
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className="text-primary"
											>
												<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
											</svg>
										}
										label="Private"
									/>

									<HoverIcon
										delay={1.5}
										icon={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width={isMobile ? "18" : "24"}
												height={isMobile ? "18" : "24"}
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className="text-primary"
											>
												<rect
													x="2"
													y="3"
													width="20"
													height="14"
													rx="2"
													ry="2"
												></rect>
												<line x1="8" y1="21" x2="16" y2="21"></line>
												<line x1="12" y1="17" x2="12" y2="21"></line>
											</svg>
										}
										label="Responsive"
									/>
								</div>
							</motion.div>
						</motion.div>

						{/* Right side: Login Form */}
						<motion.div
							className="flex items-center justify-center mt-8 md:mt-0"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
						>
							<div className="w-full max-w-sm">
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ delay: 0.4, duration: 0.5 }}
									className="backdrop-blur-sm bg-card/80 rounded-xl border shadow-lg p-1 w-full hover:shadow-xl transition-shadow duration-300"
								>
									<LoginForm />
								</motion.div>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}
