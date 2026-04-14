import richstokLogo from "@/assets/richstok-logo.png";

type RichstokLogoProps = {
  className?: string;
};

export default function RichstokLogo({className}: RichstokLogoProps) {
  const mergedClassName = `h-12 w-auto object-contain sm:h-14 ${className ?? ""}`.trim();
  return (
    <img
      src={richstokLogo}
      alt="Richstok"
      className={mergedClassName}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}
