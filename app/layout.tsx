import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title:"Luna — Theo dõi chu kỳ của bạn",
 description:"Theo dõi kỳ kinh nhẹ nhàng, chỉ cần ngày bắt đầu. Dữ liệu lưu trên thiết bị của bạn.",
 manifest:"/manifest.webmanifest",
 applicationName:"Luna",
 appleWebApp:{capable:true,statusBarStyle:"default",title:"Luna"},
 icons:{icon:"/favicon.svg",apple:"/icons/apple-touch-icon.png"},
 other:{"mobile-web-app-capable":"yes"},
};
export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#faf9f6"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
 return <html lang="vi" suppressHydrationWarning><body>{children}</body></html>;
}
