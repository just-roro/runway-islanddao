import type {Metadata} from "next";
export const metadata:Metadata={title:"RUNWAY Event API",description:"Verified flights and IslandDAO event rankings."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
