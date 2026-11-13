import "./globals.css";
export const metadata = {
  title: "Maliha Store Plus",
  description: "A multi-vendor marketplace for Bangladesh"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="bn"><body>{children}</body></html>;
}