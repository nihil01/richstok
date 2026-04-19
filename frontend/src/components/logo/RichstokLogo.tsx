import richstokLogo from "@/assets/richstok-logo.png";
import { motion } from "framer-motion";
import {Link} from "react-router-dom";

type RichstokLogoProps = {
  className?: string;
};

export default function RichstokLogo({className}: RichstokLogoProps) {
  const mergedClassName = `h-14 w-auto object-contain sm:h-16 ${className ?? ""}`.trim();
  return (
      <Link to={"/"}>

        <motion.img
            src={richstokLogo}
            alt="Richstok"
            className={mergedClassName}
            loading="eager"
            decoding="async"
            draggable={false}
        />

      </Link>

  );
}
