import { Phase3Results } from '@/components/Phase3Results';
export default async function ResultsPage({params}: {params: Promise<{id: string}>}) {
  const {id}=await params;
  return <Phase3Results runId={id} />;
}
