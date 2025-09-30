import { ReactComponent as WhalePlusLogo } from '/whaleplus-logo.svg';

interface SvgLogoProps {
  width?: number;
  height?: number;
  fill?: string;
  className?: string;
}

export const SvgLogo: React.FC<SvgLogoProps> = ({ 
  width = 120, 
  height = 120, 
  fill = "#1E3A8A",
  className = ""
}) => {
  return (
    <WhalePlusLogo 
      width={width} 
      height={height} 
      fill={fill}
      className={className}
    />
  );
};