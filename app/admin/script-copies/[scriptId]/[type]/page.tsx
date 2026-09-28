import { ScriptCopyView } from "@/components/admin/script-copies/script-copy-view"
import type { EvaluationCopyType } from "@/types/osm"

type ScriptCopyRouteProps = {
  params: Promise<{ scriptId: string; type: string }>
}

export default async function AdminScriptCopyRoute({ params }: ScriptCopyRouteProps) {
  const { scriptId, type } = await params
  const copyType: EvaluationCopyType = type === "post" ? "post_evaluation" : "pre_evaluation"
  return <ScriptCopyView scriptId={scriptId} type={copyType} />
}
