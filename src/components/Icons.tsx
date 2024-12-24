import SellerIcon from "@/../public/icons/sellers_light_50.svg";
import ProductIcon from "@/../public/icons/product_icon.svg";
import Image from "next/image";

type ImageProps = {
  height?: number;
  width?: number;
};

export const ProductsIcon = ({ height, width }: ImageProps) => (
  <Image src={ProductIcon} height={height || 35} width={width || 35} alt="" />
);

export const SellersIcon = ({ height, width }: ImageProps) => (
  <Image src={SellerIcon} height={height || 35} width={width || 35} alt="" />
);
