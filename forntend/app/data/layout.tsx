import DashboardLayout from '@/app/dashboard/layout';

export default function DataLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
