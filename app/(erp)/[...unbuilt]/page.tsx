import { UnbuiltModuleNotice } from "../../components/admin/UnbuiltModuleNotice";

type UnbuiltRoutePageProps = {
  params: Promise<{
    unbuilt?: string[];
  }>;
};

export default async function UnbuiltRoutePage({ params }: UnbuiltRoutePageProps) {
  const resolvedParams = await params;
  const path = `/${resolvedParams.unbuilt?.join("/") ?? ""}`;

  return <UnbuiltModuleNotice path={path} />;
}
