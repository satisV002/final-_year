// Public page — no layout wrapper needed (no sidebar)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
