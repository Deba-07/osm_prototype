"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatInr } from "@/lib/remuneration"
import type { Evaluator, EvaluatorRemuneration, Exam } from "@/types/osm"
import { Download, Eye } from "lucide-react"

type ReceiptProps = { open: boolean; onOpenChange: (open: boolean) => void; evaluator: Evaluator; exam?: Exam; remuneration: EvaluatorRemuneration }

export function RemunerationReceipt({ open, onOpenChange, evaluator, exam, remuneration }: ReceiptProps) {
  function printReceipt() {
    const receiptWindow = window.open("", "_blank", "noopener,noreferrer")
    if (!receiptWindow) return
    receiptWindow.document.write(`<!doctype html><html><head><title>OSM Demo Remuneration Receipt</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111;max-width:640px;margin:auto}h1{margin-bottom:4px}p{color:#555}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:10px 0}.total{font-size:20px;font-weight:bold;border-top:2px solid #111;margin-top:12px}.demo{margin-top:28px;padding:12px;background:#f2f2f2;font-weight:bold}</style></head><body><h1>OSM</h1><h2>Evaluator Remuneration Receipt</h2><p>Demo Receipt</p><div class="row"><span>Evaluator</span><strong>${evaluator.name}</strong></div><div class="row"><span>Evaluator ID</span><strong>${evaluator.id}</strong></div><div class="row"><span>Exam</span><strong>${exam?.name ?? "All submitted evaluations"}</strong></div><div class="row"><span>Completed Scripts</span><strong>${remuneration.completedScripts}</strong></div><div class="row"><span>Rate</span><strong>${formatInr(remuneration.ratePerScript)} / script</strong></div><div class="row"><span>Evaluation Amount</span><strong>${formatInr(remuneration.evaluationAmount)}</strong></div><div class="row"><span>TA/DA</span><strong>${formatInr(remuneration.taDaAmount)}</strong></div><div class="row total"><span>Total</span><strong>${formatInr(remuneration.totalAmount)}</strong></div><p>Calculated on: ${new Date(remuneration.calculatedAt).toLocaleString("en-IN")}</p><div class="demo">DEMO ONLY<br/>Not a payment confirmation</div><script>window.onload=function(){window.print()}</script></body></html>`)
    receiptWindow.document.close()
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Evaluator Remuneration Receipt</DialogTitle><DialogDescription>Demo-only calculation. This is not a payment confirmation.</DialogDescription></DialogHeader><Card><CardContent className="space-y-3 p-5 text-sm"><div className="flex justify-between gap-4"><span>Evaluator</span><strong>{evaluator.name}</strong></div><div className="flex justify-between gap-4"><span>Exam</span><strong className="text-right">{exam?.name ?? "All submitted evaluations"}</strong></div><div className="flex justify-between gap-4"><span>Completed Scripts</span><strong>{remuneration.completedScripts}</strong></div><div className="flex justify-between gap-4"><span>Rate</span><strong>{formatInr(remuneration.ratePerScript)} / script</strong></div><div className="flex justify-between gap-4"><span>Evaluation Amount</span><strong>{formatInr(remuneration.evaluationAmount)}</strong></div><div className="flex justify-between gap-4"><span>TA/DA</span><strong>{formatInr(remuneration.taDaAmount)}</strong></div><div className="flex justify-between border-t pt-3 text-base"><span>Total</span><strong>{formatInr(remuneration.totalAmount)}</strong></div><p className="pt-2 text-xs text-muted-foreground">Calculated on {new Date(remuneration.calculatedAt).toLocaleString("en-IN")}</p><p className="rounded-md bg-muted p-3 text-xs font-medium">DEMO ONLY · Not a payment confirmation</p></CardContent></Card><DialogFooter><Button type="button" variant="outline" onClick={printReceipt}><Download data-icon="inline-start" className="size-4" />Download Receipt</Button><Button type="button" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
}

export function ViewReceiptButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" size="sm" variant="outline" onClick={onClick}><Eye data-icon="inline-start" className="size-4" />View Receipt</Button>
}
