export const ProductsCollection = {
  root: "Products",
  entry: "entry",
  output: "output",
  tags: "tags",
};

export const InvoiceCollection = {
  root: "Invoices",
  outputs: "outputs",
  outputs_sold: "outputs_sold",
};

export const SellersCollection = {
  root: "Sellers",
  clients: "clients",
  credits: "credits",
  creditBundles: {
    root: "bundle-containers",
    clients: "clients",
    bundles: {
      root: "bundles",
      credits: "credits",
    },
  },
  defaulCustomPrices: "defaultCustomPrices",
  inventories: {
    root: "inventories",
    products: "products",
  },
};
