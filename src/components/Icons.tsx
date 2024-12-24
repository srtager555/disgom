import SellerIcon from "@/../public/icons/sellers_light_50.svg";
import ProductIcon from "@/../public/icons/product_icon.svg";
import InvoiceIcon from "@/../public/icons/invoice_icon.svg";
import ChartsIcon from "@/../public/icons/chart_icon.svg";
import HomeIcon from "@/../public/icons/home_icon.svg";
import Image from "next/image";
import { ImageProps, StaticImport } from "next/dist/shared/lib/get-img-props";

type iconType = "seller" | "product" | "invoice" | "chart" | "home";

interface I
  extends Omit<ImageProps, "src" | "alt">,
    Partial<Pick<ImageProps, "src" | "alt">> {
  iconType: iconType;
}

export const Icon = (props: I) => {
  const src: Record<iconType, StaticImport> = {
    home: HomeIcon,
    seller: SellerIcon,
    product: ProductIcon,
    invoice: InvoiceIcon,
    chart: ChartsIcon,
  };

  return (
    <Image height={30} width={30} {...props} src={src[props.iconType]} alt="" />
  );
};
