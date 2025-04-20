import { Inter, Montserrat, Overpass_Mono, Poppins, Roboto, PT_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto"
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins"
});

const overpass_mono = Overpass_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-overpass-mono"
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"]
});

export const fontVariables = cn(
  inter.variable,
  roboto.variable,
  montserrat.variable,
  poppins.variable,
  overpass_mono.variable,
  ptSans.variable
);
