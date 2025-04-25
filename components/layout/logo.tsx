import Image from "next/image";
import LogoIcon from "../../public/icon.jpg";
export default function Logo() {
	return (
		<Image
			// src="/logo.jpg"
			src={LogoIcon}
			width={30}
			height={30}
			className="me-1 rounded-sm transition-all group-data-collapsible:size-7 group-data-[collapsible=icon]:size-8"
			alt="Minix logo"
			unoptimized
		/>
	);
}
