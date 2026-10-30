import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPage from "@/components/home/ProductPage";
import { menuProducts } from "@/lib/landing";
import { getPublicMenu } from "@/lib/publicMenu";

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string) {
  const menu = await getPublicMenu(), products = menuProducts(menu);
  return { products, product: products.all.find((p) => p.slug === slug) };
}

// One page per menu item, built ahead; one added to the menu later is built on its first visit
export async function generateStaticParams() {
  return menuProducts(await getPublicMenu()).all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await find((await params).slug);
  if (!product) return {};
  return { title: `${product.name} – Cua Nhà Ếch`, description: `${product.name} (${product.size}). ${product.info.text}` };
}

// Same cache as /home: prices follow the dashboard's menu
export default async function Page({ params }: Props) {
  const { products, product } = await find((await params).slug);
  if (!product) notFound();
  return <ProductPage product={product} products={products} />;
}
